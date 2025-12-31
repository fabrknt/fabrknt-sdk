/**
 * Hello World - Your First Fabrknt Payment
 *
 * This example demonstrates the simplest possible payment:
 * Send 0.01 SOL to yourself on Solana devnet.
 *
 * Run: npx tsx index.ts
 */

import { BatchPayoutPattern, Guard } from "../../dist/index.mjs";
import type { PayoutRecipient } from "../../dist/index.mjs";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as dotenv from "dotenv";

// Load environment variables (optional)
dotenv.config();

// Helper function to add delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
	console.log("\n🚀 Fabrknt Hello World Example");
	console.log("━".repeat(50));

	// ============================================================================
	// STEP 1: Setup Solana Connection & Wallet
	// ============================================================================
	console.log("\n📋 Setup");

	// Connect to Solana devnet
	const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
	const connection = new Connection(rpcUrl, "confirmed");

	// Load or generate wallet
	let payer: Keypair;
	if (process.env.WALLET_PRIVATE_KEY) {
		// Reuse existing wallet from .env
		const secretKey = Uint8Array.from(JSON.parse(process.env.WALLET_PRIVATE_KEY));
		payer = Keypair.fromSecretKey(secretKey);
		console.log(`  ✓ Loaded wallet: ${payer.publicKey.toBase58()}`);
	} else {
		// Generate new wallet for this run
		payer = Keypair.generate();
		console.log(`  ✓ Generated wallet: ${payer.publicKey.toBase58()}`);
		console.log(`    (To reuse: Add private key to .env file)`);
	}

	// ============================================================================
	// STEP 2: Request Devnet Airdrop
	// ============================================================================

	// Check current balance
	let balance = await connection.getBalance(payer.publicKey);
	console.log(`  ℹ Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);

	// Request airdrop if balance is low
	if (balance < 0.1 * LAMPORTS_PER_SOL) {
		console.log(`  ⏳ Requesting airdrop: 1 SOL...`);
		try {
			const signature = await connection.requestAirdrop(payer.publicKey, 1 * LAMPORTS_PER_SOL);

			// Wait for confirmation
			await connection.confirmTransaction(signature);

			// Update balance
			balance = await connection.getBalance(payer.publicKey);
			console.log(`  ✓ Airdrop successful! New balance: ${balance / LAMPORTS_PER_SOL} SOL`);
		} catch (error) {
			console.error("  ✗ Airdrop failed:", (error as Error).message);
			console.log("  ℹ Try again in 30 seconds or use https://faucet.solana.com");
			process.exit(1);
		}
	} else {
		console.log(`  ✓ Balance sufficient: ${balance / LAMPORTS_PER_SOL} SOL`);
	}

	// ============================================================================
	// STEP 3: Create Payment with Guard Security
	// ============================================================================
	console.log("\n💰 Executing Payment");

	// Create Guard for security validation
	const guard = new Guard({
		mode: "block", // Block suspicious transactions
		maxSlippage: 0.01, // Max 1% slippage
	});
	console.log(`  ✓ Guard configured (mode: block, maxSlippage: 1%)`);

	// Create recipient (sending to ourselves for demo)
	const recipients: PayoutRecipient[] = [
		{
			wallet: payer.publicKey.toBase58(),
			amount: 0.01, // 0.01 SOL
			token: "SOL",
			id: "hello-world-recipient",
			memo: "My first Fabrknt payment!",
		},
	];

	// Create BatchPayoutPattern (even for 1 recipient, pattern handles retries/security)
	const payment = new BatchPayoutPattern({
		name: "Hello World Payment",
		recipients,
		guard,
		senderWallet: payer.publicKey.toBase58(),
		enableParallel: false, // Not needed for 1 payment
		generateReport: true, // Get transaction report
		dryRun: false, // Execute real transaction (on devnet)
	});
	console.log(`  ✓ Created BatchPayoutPattern with 1 recipient`);

	// ============================================================================
	// STEP 4: Execute Payment
	// ============================================================================
	console.log(`  ⏳ Executing transaction...`);

	try {
		const result = await payment.execute();

		if (result.success) {
			console.log("\n✅ Success!\n");

			// Display transaction details
			const tx = result.transactions[0];
			console.log(`  • Recipient: ${recipients[0].wallet}`);
			console.log(`  • Amount: ${recipients[0].amount} SOL`);
			console.log(`  • Transaction: https://explorer.solana.com/tx/${tx.id}?cluster=devnet`);
			console.log(`  • Gas cost: ${result.metrics.actualCost} SOL`);
			console.log(`  • Duration: ${result.metrics.executionTime}ms`);

			// Show report if generated
			if (result.metadata?.report) {
				console.log("\n📊 Transaction Report:");
				const report = result.metadata.report[0];
				console.log(`  • Status: ${report.status}`);
				console.log(`  • Timestamp: ${new Date(report.timestamp).toLocaleString()}`);
				console.log(`  • Memo: ${report.memo}`);
			}

			console.log("\n🎉 You just executed your first Fabrknt payment!");
			console.log("\nNext steps:");
			console.log("  1. Check the transaction on Solana Explorer");
			console.log("  2. Explore the payroll example: ../payroll");
			console.log("  3. Read the docs: ../../docs/getting-started.md\n");
		} else {
			console.error("\n❌ Payment failed:", result.error?.message);
			console.log("\nTroubleshooting:");
			console.log("  • Check your balance is sufficient");
			console.log("  • Verify devnet RPC is working");
			console.log("  • See README.md for more help\n");
			process.exit(1);
		}
	} catch (error) {
		console.error("\n❌ Execution error:", (error as Error).message);
		console.error("\nStack trace:", error);
		process.exit(1);
	}
}

// Run the example
main().catch(console.error);
