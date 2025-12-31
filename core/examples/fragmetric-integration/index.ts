/**
 * Fragmetric Integration Example
 *
 * This example demonstrates how to safely interact with Fragmetric's fragSOL
 * token using fabrknt's Guard module for Transfer Hook validation.
 *
 * fragSOL is Solana's first native Liquid Restaking Token (LRT) that uses
 * Token-2022 Transfer Hooks for time-weighted reward distribution.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  getMint,
  getTransferHook,
  createTransferCheckedInstruction,
  getOrCreateAssociatedTokenAccount,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { Guard, PatternId } from "@fabrknt/sdk";
import * as dotenv from "dotenv";

dotenv.config();

// Fragmetric fragSOL constants
export const FRAGSOL_MINT = new PublicKey("FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo");
export const FRAGSOL_DECIMALS = 9;
export const FRAGMETRIC_HOOK_PROGRAM = "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3";

/**
 * Check if a token has Transfer Hook extension
 */
async function checkForTransferHook(
  connection: Connection,
  mintAddress: PublicKey
): Promise<{ hasHook: boolean; programId?: PublicKey; authority?: PublicKey }> {
  try {
    const mintInfo = await getMint(
      connection,
      mintAddress,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    const hook = getTransferHook(mintInfo);

    if (hook) {
      console.log("✅ Token has Transfer Hook extension");
      console.log(`   Program ID: ${hook.programId.toString()}`);
      console.log(`   Authority: ${hook.authority?.toString() || "None"}`);

      return {
        hasHook: true,
        programId: hook.programId,
        authority: hook.authority || undefined,
      };
    }

    console.log("ℹ️  Token does not have Transfer Hook");
    return { hasHook: false };
  } catch (error) {
    console.error("Error checking for Transfer Hook:", error);
    throw error;
  }
}

/**
 * Validate transaction with Guard before signing
 */
async function validateWithGuard(
  transaction: Transaction,
  hookProgramId?: PublicKey
): Promise<boolean> {
  console.log("\n🛡️  Validating transaction with Guard...");

  // Create Guard with Transfer Hook validation enabled
  const guard = new Guard({
    validateTransferHooks: true,
    allowedHookPrograms: [FRAGMETRIC_HOOK_PROGRAM],
    maxHookAccounts: 20,
    mode: "block",
  });

  // Convert transaction to Guard format
  const guardTransaction = {
    id: `tx-${Date.now()}`,
    status: "pending" as const,
    instructions: transaction.instructions.map((ix) => ({
      programId: ix.programId.toString(),
      keys: ix.keys.map((k) => ({
        pubkey: k.pubkey.toString(),
        isSigner: k.isSigner,
        isWritable: k.isWritable,
      })),
      data: ix.data.toString("base64"),
    })),
  };

  // Validate
  const result = await guard.validateTransaction(guardTransaction);

  if (!result.isValid) {
    console.error("❌ Transaction validation failed");
    console.error(`   Blocked by: ${result.blockedBy?.join(", ")}`);

    for (const warning of result.warnings) {
      console.error(`   [${warning.severity}] ${warning.message}`);
    }

    return false;
  }

  // Log any warnings
  if (result.warnings.length > 0) {
    console.log("\n⚠️  Warnings detected:");
    for (const warning of result.warnings) {
      console.log(`   [${warning.severity}] ${warning.message}`);
    }
  } else {
    console.log("✅ Transaction validated successfully - no issues detected");
  }

  return true;
}

/**
 * Safe fragSOL transfer with Guard validation
 */
async function safeFragSOLTransfer(
  connection: Connection,
  fromWallet: Keypair,
  toAddress: PublicKey,
  amount: number
): Promise<string> {
  console.log("\n🔄 Initiating fragSOL transfer...");
  console.log(`   From: ${fromWallet.publicKey.toString()}`);
  console.log(`   To: ${toAddress.toString()}`);
  console.log(`   Amount: ${amount / 10 ** FRAGSOL_DECIMALS} fragSOL`);

  // 1. Check for Transfer Hook
  console.log("\n📋 Step 1: Checking for Transfer Hook extension...");
  const hookInfo = await checkForTransferHook(connection, FRAGSOL_MINT);

  if (hookInfo.hasHook) {
    // Verify it's the expected Fragmetric hook
    if (hookInfo.programId?.toString() !== FRAGMETRIC_HOOK_PROGRAM) {
      throw new Error(
        `Unknown Transfer Hook program: ${hookInfo.programId?.toString()}`
      );
    }
    console.log("✅ Verified: This is the official Fragmetric Transfer Hook");
  }

  // 2. Get or create token accounts
  console.log("\n📋 Step 2: Setting up token accounts...");

  const fromAta = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    FRAGSOL_MINT,
    fromWallet.publicKey,
    false,
    "confirmed",
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  const toAta = await getOrCreateAssociatedTokenAccount(
    connection,
    fromWallet,
    FRAGSOL_MINT,
    toAddress,
    false,
    "confirmed",
    undefined,
    TOKEN_2022_PROGRAM_ID
  );

  console.log(`   From ATA: ${fromAta.address.toString()}`);
  console.log(`   To ATA: ${toAta.address.toString()}`);

  // 3. Build transfer instruction
  console.log("\n📋 Step 3: Building transfer instruction...");

  const transferIx = createTransferCheckedInstruction(
    fromAta.address,
    FRAGSOL_MINT,
    toAta.address,
    fromWallet.publicKey,
    amount,
    FRAGSOL_DECIMALS,
    [],
    TOKEN_2022_PROGRAM_ID
  );

  const transaction = new Transaction().add(transferIx);
  transaction.feePayer = fromWallet.publicKey;
  transaction.recentBlockhash = (
    await connection.getLatestBlockhash("confirmed")
  ).blockhash;

  console.log("✅ Transfer instruction created");

  // 4. Validate with Guard (if Transfer Hook present)
  if (hookInfo.hasHook) {
    console.log("\n📋 Step 4: Validating transaction with Guard...");

    const isValid = await validateWithGuard(transaction, hookInfo.programId);

    if (!isValid) {
      throw new Error("Transaction validation failed - refusing to sign");
    }
  } else {
    console.log("\n📋 Step 4: Skipping Guard validation (no Transfer Hook)");
  }

  // 5. Sign and send
  console.log("\n📋 Step 5: Signing and sending transaction...");

  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [fromWallet],
    {
      commitment: "confirmed",
    }
  );

  console.log("\n✅ Transfer successful!");
  console.log(`   Signature: ${signature}`);
  console.log(`   Explorer: https://solscan.io/tx/${signature}`);

  return signature;
}

/**
 * Example: Transfer fragSOL with automatic validation
 */
async function exampleBasicTransfer() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Example 1: Basic fragSOL Transfer with Guard");
  console.log("═══════════════════════════════════════════════════════\n");

  const connection = new Connection(
    process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  // Load wallet from environment
  const wallet = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || "[]"))
  );

  // Example recipient (replace with actual address)
  const recipient = new PublicKey(
    process.env.RECIPIENT_ADDRESS || wallet.publicKey.toString()
  );

  try {
    // Transfer 0.1 fragSOL
    const amount = 0.1 * 10 ** FRAGSOL_DECIMALS;

    await safeFragSOLTransfer(connection, wallet, recipient, amount);
  } catch (error) {
    console.error("\n❌ Transfer failed:");
    console.error(error);
    process.exit(1);
  }
}

/**
 * Example: Batch transfers with Guard validation
 */
async function exampleBatchTransfers() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Example 2: Batch fragSOL Transfers with Guard");
  console.log("═══════════════════════════════════════════════════════\n");

  const connection = new Connection(
    process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  const wallet = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(process.env.WALLET_PRIVATE_KEY || "[]"))
  );

  // Example recipients
  const recipients = [
    { address: new PublicKey("..."), amount: 0.5 },
    { address: new PublicKey("..."), amount: 1.0 },
    { address: new PublicKey("..."), amount: 0.25 },
  ];

  console.log(`Processing ${recipients.length} transfers...\n`);

  const results = [];

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];

    try {
      console.log(`\n[${i + 1}/${recipients.length}] Processing transfer...`);

      const signature = await safeFragSOLTransfer(
        connection,
        wallet,
        recipient.address,
        recipient.amount * 10 ** FRAGSOL_DECIMALS
      );

      results.push({ success: true, signature });

      // Wait between transfers to avoid rate limits
      if (i < recipients.length - 1) {
        console.log("\n⏳ Waiting 2 seconds before next transfer...");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`\n❌ Transfer ${i + 1} failed:`, error);
      results.push({ success: false, error });
    }
  }

  // Summary
  console.log("\n═══════════════════════════════════════════════════════");
  console.log("  Batch Transfer Summary");
  console.log("═══════════════════════════════════════════════════════\n");

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
}

/**
 * Example: Inspect Transfer Hook details
 */
async function exampleInspectHook() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  Example 3: Inspect fragSOL Transfer Hook");
  console.log("═══════════════════════════════════════════════════════\n");

  const connection = new Connection(
    process.env.RPC_URL || "https://api.mainnet-beta.solana.com",
    "confirmed"
  );

  try {
    // Get mint info
    console.log("📋 Fetching fragSOL mint information...\n");

    const mintInfo = await getMint(
      connection,
      FRAGSOL_MINT,
      "confirmed",
      TOKEN_2022_PROGRAM_ID
    );

    console.log("Token Details:");
    console.log(`  Mint: ${FRAGSOL_MINT.toString()}`);
    console.log(`  Supply: ${mintInfo.supply.toString()}`);
    console.log(`  Decimals: ${mintInfo.decimals}`);
    console.log(`  Mint Authority: ${mintInfo.mintAuthority?.toString() || "None"}`);
    console.log(`  Freeze Authority: ${mintInfo.freezeAuthority?.toString() || "None"}`);

    // Check for Transfer Hook
    const hook = getTransferHook(mintInfo);

    if (hook) {
      console.log("\n✅ Transfer Hook Extension Found:");
      console.log(`  Program ID: ${hook.programId.toString()}`);
      console.log(`  Authority: ${hook.authority?.toString() || "None"}`);

      // Check if it's the known Fragmetric hook
      if (hook.programId.toString() === FRAGMETRIC_HOOK_PROGRAM) {
        console.log("\n  ✅ This is the verified Fragmetric Transfer Hook");
        console.log("  Purpose: Time-weighted reward distribution");
        console.log("  Status: Safe (whitelisted in fabrknt Guard)");
      } else {
        console.log("\n  ⚠️  WARNING: Unknown Transfer Hook program!");
        console.log("  Do not transfer without verification");
      }

      // Get program info
      console.log("\n📋 Transfer Hook Program Details:");

      const programInfo = await connection.getAccountInfo(hook.programId);

      if (programInfo) {
        console.log(`  Owner: ${programInfo.owner.toString()}`);
        console.log(`  Executable: ${programInfo.executable}`);
        console.log(`  Data Length: ${programInfo.data.length} bytes`);
        console.log(`  Lamports: ${programInfo.lamports}`);
      }
    } else {
      console.log("\nℹ️  No Transfer Hook extension found");
    }

    // Check other extensions
    console.log("\n📋 Checking for other Token-2022 extensions...");

    // Note: You can add checks for other extensions here
    // (Metadata, Permanent Delegate, etc.)

    console.log("\n✅ Inspection complete");
  } catch (error) {
    console.error("\n❌ Inspection failed:", error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const example = args[0] || "basic";

  switch (example) {
    case "basic":
      await exampleBasicTransfer();
      break;

    case "batch":
      await exampleBatchTransfers();
      break;

    case "inspect":
      await exampleInspectHook();
      break;

    default:
      console.log("Usage: npm start [example]");
      console.log("\nExamples:");
      console.log("  basic   - Basic fragSOL transfer with Guard (default)");
      console.log("  batch   - Batch transfers with validation");
      console.log("  inspect - Inspect fragSOL Transfer Hook details");
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

// Export for use as library
export { checkForTransferHook, validateWithGuard, safeFragSOLTransfer };
