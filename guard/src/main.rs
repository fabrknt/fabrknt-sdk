mod detector;

use anyhow::Result;
use clap::{Parser, Subcommand};
use colored::Colorize;
use log::{info, error, warn};
use solana_client::{
    rpc_client::RpcClient,
    rpc_config::RpcTransactionConfig,
};
use solana_sdk::{commitment_config::CommitmentConfig, pubkey::Pubkey, signature::Signature};
use solana_transaction_status::UiTransactionEncoding;
use std::str::FromStr;
use std::collections::HashSet;

#[derive(Parser)]
#[command(name = "guard")]
#[command(author, version, about = "Guard - Prevent operational disasters on Solana", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Watch a program for dangerous operations
    Watch {
        /// Program ID to monitor
        #[arg(long, value_name = "PUBKEY")]
        program_id: String,

        /// Solana cluster environment
        #[arg(long, value_name = "ENV", default_value = "mainnet")]
        env: String,

        /// RPC URL (optional, will use default for environment if not specified)
        #[arg(long, value_name = "URL")]
        rpc_url: Option<String>,

        /// Discord webhook URL for notifications
        #[arg(long, value_name = "URL")]
        discord_webhook: Option<String>,

        /// Poll interval in seconds
        #[arg(long, value_name = "SECONDS", default_value = "5")]
        poll_interval: u64,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logger
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let cli = Cli::parse();

    match cli.command {
        Commands::Watch {
            program_id,
            env,
            rpc_url,
            discord_webhook,
            poll_interval,
        } => {
            // Parse and validate program ID
            let pubkey = Pubkey::from_str(&program_id)
                .map_err(|e| anyhow::anyhow!("Invalid program ID: {}", e))?;

            // Determine RPC URL
            let rpc_endpoint = rpc_url.unwrap_or_else(|| get_default_rpc_url(&env));

            info!("🛡️  {}", "Guard Starting...".bold().green());
            info!("📡 Monitoring Program ID: {}", pubkey.to_string().cyan());
            info!("🌐 Environment: {}", env.yellow());
            info!("🔗 RPC Endpoint: {}", rpc_endpoint.blue());
            if discord_webhook.is_some() {
                info!("📢 Discord Webhook: {}", "Configured".green());
            }
            info!("⏱️  Poll Interval: {}s", poll_interval);
            info!("");

            // Run the watch command
            if let Err(e) = run_watch(pubkey, rpc_endpoint, discord_webhook, poll_interval).await {
                error!("❌ {}: {}", "Fatal Error".red().bold(), e);
                return Err(e);
            }
        }
    }

    Ok(())
}

async fn run_watch(
    program_id: Pubkey,
    rpc_url: String,
    _discord_webhook: Option<String>,
    poll_interval: u64,
) -> Result<()> {
    info!("🔍 Starting transaction monitoring...");
    info!("ℹ️  Press Ctrl+C to stop");
    info!("");

    // Connect to Solana RPC
    let rpc_client = RpcClient::new_with_commitment(rpc_url.clone(), CommitmentConfig::confirmed());

    // Test connection
    match rpc_client.get_version() {
        Ok(version) => {
            info!("✅ Connected to Solana RPC (version: {})", version.solana_core);
        }
        Err(e) => {
            error!("❌ Failed to connect to RPC: {}", e);
            return Err(anyhow::anyhow!("RPC connection failed: {}", e));
        }
    }

    // Track processed signatures to avoid duplicates
    let mut processed_signatures: HashSet<String> = HashSet::new();

    // Main monitoring loop
    loop {
        match fetch_and_analyze_transactions(
            &rpc_client,
            &program_id,
            &mut processed_signatures,
        )
        .await
        {
            Ok(warning_count) => {
                if warning_count > 0 {
                    info!("");
                    info!("📊 Processed batch: {} warnings detected", warning_count);
                    info!("");
                }
            }
            Err(e) => {
                warn!("⚠️  Error processing transactions: {}", e);
            }
        }

        // Wait before next poll
        tokio::time::sleep(tokio::time::Duration::from_secs(poll_interval)).await;
    }
}

async fn fetch_and_analyze_transactions(
    rpc_client: &RpcClient,
    program_id: &Pubkey,
    processed_signatures: &mut HashSet<String>,
) -> Result<usize> {
    let mut warning_count = 0;

    // Fetch recent signatures for the program
    let signatures = rpc_client
        .get_signatures_for_address(program_id)
        .map_err(|e| anyhow::anyhow!("Failed to fetch signatures: {}", e))?;

    // Process each signature
    for sig_info in signatures.iter().take(10) {
        // Skip if already processed
        if processed_signatures.contains(&sig_info.signature) {
            continue;
        }

        // Parse signature
        let signature = match Signature::from_str(&sig_info.signature) {
            Ok(sig) => sig,
            Err(e) => {
                warn!("Failed to parse signature {}: {}", sig_info.signature, e);
                continue;
            }
        };

        // Fetch transaction details with versioned transaction support
        let config = RpcTransactionConfig {
            encoding: Some(UiTransactionEncoding::JsonParsed),
            commitment: Some(CommitmentConfig::confirmed()),
            max_supported_transaction_version: Some(0),
        };

        match rpc_client.get_transaction_with_config(&signature, config) {
            Ok(tx) => {
                // Analyze transaction
                match detector::analyze_transaction(&tx) {
                    Ok(warnings) => {
                        if !warnings.is_empty() {
                            info!(
                                "🔍 Transaction: {}",
                                format!(
                                    "https://solscan.io/tx/{}",
                                    sig_info.signature
                                )
                                .blue()
                                .underline()
                            );

                            for warning in warnings {
                                print!("{}", warning.format_terminal());
                                warning_count += 1;
                            }
                        }
                    }
                    Err(e) => {
                        warn!("Failed to analyze transaction {}: {}", sig_info.signature, e);
                    }
                }

                // Mark as processed
                processed_signatures.insert(sig_info.signature.clone());

                // Limit cache size
                if processed_signatures.len() > 1000 {
                    processed_signatures.clear();
                }
            }
            Err(e) => {
                warn!("Failed to fetch transaction {}: {}", sig_info.signature, e);
            }
        }
    }

    Ok(warning_count)
}

fn get_default_rpc_url(env: &str) -> String {
    match env.to_lowercase().as_str() {
        "mainnet" | "mainnet-beta" => "https://api.mainnet-beta.solana.com".to_string(),
        "devnet" => "https://api.devnet.solana.com".to_string(),
        "testnet" => "https://api.testnet.solana.com".to_string(),
        "localhost" | "local" => "http://localhost:8899".to_string(),
        _ => {
            log::warn!("Unknown environment '{}', defaulting to mainnet", env);
            "https://api.mainnet-beta.solana.com".to_string()
        }
    }
}
