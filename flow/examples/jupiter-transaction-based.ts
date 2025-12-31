/**
 * Example: Using Jupiter Transaction-Based Approach for Rebalancing
 * 
 * This example demonstrates how to:
 * 1. Get a Jupiter quote for a swap
 * 2. Get a swap transaction from Jupiter API
 * 3. Create a rebalance decision with the swap transaction
 * 4. Execute the swap transaction off-chain
 * 5. Execute the rebalance with swap execution signature
 */

import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Flow } from "../target/types/flow";
import { PublicKey, Keypair, Connection } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getJupiterQuote,
  getJupiterSwapTransaction,
  executeJupiterSwap,
  getJupiterSwapForRebalance,
} from "../src/jupiter-api";

// Example usage
async function exampleRebalanceWithJupiterSwap() {
  // Setup
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.flow as Program<Flow>;
  const connection = provider.connection;

  // Example token mints (replace with actual tokens)
  const inputMint = "So11111111111111111111111111111111111111112"; // SOL
  const outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // USDC

  // User and position setup
  const user = Keypair.generate();
  const positionIndex = 0;
  const decisionIndex = 0;

  // Derive PDAs
  const [positionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("liquidity_position"),
      user.publicKey.toBuffer(),
      Buffer.from([positionIndex]),
    ],
    program.programId
  );

  const [decisionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("rebalance_decision"),
      positionPda.toBuffer(),
      Buffer.from(new BN(decisionIndex).toArrayLike(Buffer, "le", 4)),
    ],
    program.programId
  );

  // Step 1: Calculate swap amount needed for rebalancing
  // (This would come from your rebalancing logic)
  const swapAmount = 1_000_000_000; // 1 SOL in lamports
  const slippageBps = 50; // 0.5% slippage

  // Step 2: Get Jupiter quote and swap transaction
  console.log("Getting Jupiter quote and swap transaction...");
  const { quote, swapTransaction, expectedOutputAmount } =
    await getJupiterSwapForRebalance(
      inputMint,
      outputMint,
      swapAmount,
      user.publicKey,
      slippageBps
    );

  console.log(`Quote received:`);
  console.log(`  Input: ${quote.inAmount}`);
  console.log(`  Output: ${quote.outAmount}`);
  console.log(`  Price Impact: ${quote.priceImpactPct}%`);

  // Step 3: Create rebalance decision with swap transaction
  console.log("\nCreating rebalance decision with swap transaction...");
  await program.methods
    .createRebalanceDecision(
      positionIndex,
      decisionIndex,
      -1000, // new_tick_lower
      1000, // new_tick_upper
      new BN("1000000000000000000"), // new_price_lower
      new BN("2000000000000000000"), // new_price_upper
      "v1.0.0", // ai_model_version
      Array.from(Buffer.alloc(32, 1)), // ai_model_hash
      8500, // prediction_confidence
      5000, // market_sentiment_score
      3000, // volatility_metric
      2000, // whale_activity_score
      "Rebalance with Jupiter swap", // decision_reason
      swapTransaction.swapTransaction, // jupiter_swap_transaction (base64)
      new BN(expectedOutputAmount) // expected_output_amount
    )
    .accounts({
      decision: decisionPda,
      position: positionPda,
      config: /* config PDA */,
      payer: user.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([user])
    .rpc();

  console.log("Rebalance decision created!");

  // Step 4: Execute the swap transaction off-chain
  console.log("\nExecuting Jupiter swap transaction...");
  const swapSignature = await executeJupiterSwap(
    swapTransaction.swapTransaction,
    connection,
    [user] // Signers
  );

  console.log(`Swap executed! Signature: ${swapSignature}`);

  // Step 5: Execute rebalance with swap execution signature
  console.log("\nExecuting rebalance with swap signature...");
  await program.methods
    .executeRebalance(
      positionIndex,
      decisionIndex,
      slippageBps,
      null, // route_plan (null for transaction-based approach)
      swapSignature // swap_execution_signature
    )
    .accounts({
      decision: decisionPda,
      position: positionPda,
      config: /* config PDA */,
      approver: null,
      auditLog: /* audit log PDA */,
      // Jupiter accounts not needed for transaction-based approach
      tokenProgram: null,
      jupiterProgram: null,
      sourceTokenAccount: null,
      destinationTokenAccount: null,
      programAuthority: null,
      userTransferAuthority: null,
    })
    .rpc();

  console.log("Rebalance executed successfully!");
}

// Alternative: Step-by-step approach
async function exampleStepByStep() {
  const provider = anchor.AnchorProvider.env();
  const connection = provider.connection;
  const user = Keypair.generate();

  const inputMint = "So11111111111111111111111111111111111111112";
  const outputMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const amount = 1_000_000_000;

  // Step 1: Get quote
  const quote = await getJupiterQuote(
    inputMint,
    outputMint,
    amount,
    50 // slippageBps
  );

  // Step 2: Get swap transaction
  const swapTx = await getJupiterSwapTransaction(quote, user.publicKey, {
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
  });

  // Step 3: Use swapTx.swapTransaction (base64 string) in createRebalanceDecision
  // Step 4: Execute swap transaction
  // Step 5: Use swap signature in executeRebalance
}

export { exampleRebalanceWithJupiterSwap, exampleStepByStep };

