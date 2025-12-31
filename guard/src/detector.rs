use anyhow::Result;
use colored::Colorize;
use solana_sdk::pubkey::Pubkey;
use solana_transaction_status::{
    EncodedConfirmedTransactionWithStatusMeta, EncodedTransaction, UiInstruction,
    UiMessage, UiParsedInstruction,
};
use std::collections::HashSet;

/// Warning severity levels
#[derive(Debug, Clone, PartialEq)]
pub enum Severity {
    Critical,
    Warning,
    Alert,
}

/// Detection pattern IDs from the spec
#[derive(Debug, Clone, PartialEq)]
pub enum PatternId {
    P101MintKill,
    P102FreezeKill,
    P103SignerMismatch,
    P104DangerousClose,
}

/// A warning detected in a transaction
#[derive(Debug, Clone)]
pub struct Warning {
    pub pattern_id: PatternId,
    pub severity: Severity,
    pub message: String,
    pub affected_account: Option<Pubkey>,
}

impl Warning {
    /// Format the warning for terminal output
    pub fn format_terminal(&self) -> String {
        let severity_icon = match self.severity {
            Severity::Critical => "🚨 CRITICAL".red().bold(),
            Severity::Warning => "⚠️  WARNING".yellow().bold(),
            Severity::Alert => "⚠️  ALERT".yellow().bold(),
        };

        let pattern_name = match self.pattern_id {
            PatternId::P101MintKill => "Mint Authority Kill (P-101)",
            PatternId::P102FreezeKill => "Freeze Authority Kill (P-102)",
            PatternId::P103SignerMismatch => "Signer Mismatch (P-103)",
            PatternId::P104DangerousClose => "Dangerous Account Close (P-104)",
        };

        let mut output = format!("{}: {}\n", severity_icon, pattern_name.bold());
        output.push_str(&format!("  {}\n", self.message));
        if let Some(account) = self.affected_account {
            output.push_str(&format!("  Affected Account: {}\n", account.to_string().cyan()));
        }

        output
    }
}

/// Analyzes a transaction and detects dangerous patterns
pub fn analyze_transaction(
    tx: &EncodedConfirmedTransactionWithStatusMeta,
) -> Result<Vec<Warning>> {
    let mut warnings = Vec::new();

    // Get the UI transaction (JSON parsed format)
    let ui_transaction = match &tx.transaction.transaction {
        EncodedTransaction::Json(ui_tx) => ui_tx,
        _ => {
            // Skip non-JSON transactions
            return Ok(warnings);
        }
    };

    // Extract account keys and instructions from the message
    let (account_keys, instructions) = match &ui_transaction.message {
        UiMessage::Parsed(parsed_msg) => (&parsed_msg.account_keys, &parsed_msg.instructions),
        UiMessage::Raw(_) => {
            // Skip raw messages - we need parsed format
            return Ok(warnings);
        }
    };

    // Extract signers from account keys
    let signers: HashSet<Pubkey> = account_keys
        .iter()
        .filter_map(|key| {
            // Check if this account is a signer
            if key.signer {
                key.pubkey.parse::<Pubkey>().ok()
            } else {
                None
            }
        })
        .collect();

    // Analyze each instruction
    for instruction in instructions {
        if let UiInstruction::Parsed(parsed_ix) = instruction {
            match parsed_ix {
                UiParsedInstruction::Parsed(parsed) => {
                    // Check for SPL Token program
                    if parsed.program == "spl-token" || parsed.program == "spl-token-2022" {
                        // Analyze based on instruction type
                        match parsed.parsed["type"].as_str() {
                            Some("setAuthority") => {
                                warnings.extend(analyze_set_authority(&parsed, &signers)?);
                            }
                            Some("closeAccount") => {
                                warnings.extend(analyze_close_account(&parsed)?);
                            }
                            _ => {}
                        }
                    }
                }
                _ => {}
            }
        }
    }

    Ok(warnings)
}

/// P-101: Mint Authority Kill
/// P-102: Freeze Authority Kill
/// P-103: Signer Mismatch
fn analyze_set_authority(
    parsed: &solana_transaction_status::parse_instruction::ParsedInstruction,
    signers: &HashSet<Pubkey>,
) -> Result<Vec<Warning>> {
    let mut warnings = Vec::new();

    let info = &parsed.parsed["info"];
    let authority_type = info["authorityType"].as_str();
    let new_authority = info["newAuthority"].as_str();
    let account = info["account"]
        .as_str()
        .and_then(|s| s.parse::<Pubkey>().ok());

    match authority_type {
        Some("mintTokens") => {
            if new_authority.is_none() {
                // P-101: Mint Kill
                warnings.push(Warning {
                    pattern_id: PatternId::P101MintKill,
                    severity: Severity::Critical,
                    message: "You are permanently disabling Mint Authority. This token can NEVER be minted again.".to_string(),
                    affected_account: account,
                });
            } else if let Some(new_auth_str) = new_authority {
                // P-103: Signer Mismatch for mint authority
                if let Ok(new_auth_pubkey) = new_auth_str.parse::<Pubkey>() {
                    if !signers.contains(&new_auth_pubkey) {
                        warnings.push(Warning {
                            pattern_id: PatternId::P103SignerMismatch,
                            severity: Severity::Critical,
                            message: format!(
                                "New mint authority ({}) is a wallet you don't currently sign for. Potential Typo/Lockout risk.",
                                new_auth_str
                            ),
                            affected_account: account,
                        });
                    }
                }
            }
        }
        Some("freezeAccount") => {
            if new_authority.is_none() {
                // P-102: Freeze Kill
                warnings.push(Warning {
                    pattern_id: PatternId::P102FreezeKill,
                    severity: Severity::Warning,
                    message: "You are losing the ability to freeze accounts. Risk of regulatory non-compliance.".to_string(),
                    affected_account: account,
                });
            } else if let Some(new_auth_str) = new_authority {
                // P-103: Signer Mismatch for freeze authority
                if let Ok(new_auth_pubkey) = new_auth_str.parse::<Pubkey>() {
                    if !signers.contains(&new_auth_pubkey) {
                        warnings.push(Warning {
                            pattern_id: PatternId::P103SignerMismatch,
                            severity: Severity::Critical,
                            message: format!(
                                "New freeze authority ({}) is a wallet you don't currently sign for. Potential Typo/Lockout risk.",
                                new_auth_str
                            ),
                            affected_account: account,
                        });
                    }
                }
            }
        }
        Some("accountOwner") | Some("closeAccount") => {
            if let Some(new_auth_str) = new_authority {
                // P-103: Signer Mismatch for other authority types
                if let Ok(new_auth_pubkey) = new_auth_str.parse::<Pubkey>() {
                    if !signers.contains(&new_auth_pubkey) {
                        warnings.push(Warning {
                            pattern_id: PatternId::P103SignerMismatch,
                            severity: Severity::Critical,
                            message: format!(
                                "New authority ({}) is a wallet you don't currently sign for. Potential Typo/Lockout risk.",
                                new_auth_str
                            ),
                            affected_account: account,
                        });
                    }
                }
            }
        }
        _ => {}
    }

    Ok(warnings)
}

/// P-104: Dangerous Close Account
fn analyze_close_account(
    parsed: &solana_transaction_status::parse_instruction::ParsedInstruction,
) -> Result<Vec<Warning>> {
    let mut warnings = Vec::new();

    let info = &parsed.parsed["info"];
    let account = info["account"]
        .as_str()
        .and_then(|s| s.parse::<Pubkey>().ok());

    // Note: In a real implementation, we would need to fetch the account data
    // to check if it has remaining balance. For now, we'll issue a warning
    // for all close account instructions as they are potentially dangerous.
    warnings.push(Warning {
        pattern_id: PatternId::P104DangerousClose,
        severity: Severity::Warning,
        message: "Closing account. Ensure the account has no remaining balance or tokens to avoid loss.".to_string(),
        affected_account: account,
    });

    Ok(warnings)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_warning_format() {
        let warning = Warning {
            pattern_id: PatternId::P101MintKill,
            severity: Severity::Critical,
            message: "Test warning message".to_string(),
            affected_account: None,
        };

        let formatted = warning.format_terminal();
        assert!(formatted.contains("CRITICAL"));
        assert!(formatted.contains("Test warning message"));
    }
}
