/**
 * Example: Compressed Token Transfer
 *
 * Demonstrates how to transfer compressed tokens using Light Protocol's
 * ZK Compression. This provides privacy and drastically reduces costs.
 */

import * as dotenv from "dotenv";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createConnection, createLightRpc } from "../lib/connection";
import {
    createCompressedAccount,
    transferCompressed,
    getCompressedBalance,
} from "../lib/compressed-account";
import { createMint } from "@lightprotocol/compressed-token";
import { NetworkConfig } from "../types";
import bs58 from "bs58";

dotenv.config();

async function main() {
    console.log("=== Privacy SSM - Compressed Transfer Demo ===\n");

    // Setup
    const config: NetworkConfig = {
        rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
        photonRpcUrl: process.env.PHOTON_RPC_URL,
        network: "devnet",
    };

    const connection = createConnection(config);
    const lightRpc = createLightRpc(config);

    // Load keypairs
    const payerPrivateKey = process.env.AIRDROP_AUTHORITY_PRIVATE_KEY;
    if (!payerPrivateKey) {
        throw new Error("AIRDROP_AUTHORITY_PRIVATE_KEY not set");
    }

    const payer = Keypair.fromSecretKey(bs58.decode(payerPrivateKey));
    console.log(`Payer: ${payer.publicKey.toBase58()}\n`);

    // Create a compressed token mint
    // Standard SPL mints won't work - we need a compressed-compatible mint
    console.log("Creating compressed token mint...");
    const { mint, transactionSignature } = await createMint(
        lightRpc,
        payer,
        payer.publicKey, // mint authority
        6 // decimals
    );

    console.log(`✓ Compressed mint created: ${mint.toBase58()}`);
    console.log(`Signature: ${transactionSignature}\n`);

    // ===================================================================
    // This demonstrates compressed token transfers using Light Protocol
    // Light Protocol is already deployed on devnet
    // ===================================================================

    console.log("Compressed Transfer Workflow:");
    console.log("1. Mint compressed tokens to recipient");
    console.log("2. Transfer uses Merkle proofs from Photon API");
    console.log("3. ZK proofs generated automatically");
    console.log("4. Only 128 bytes stored on-chain\n");

    try {
        // Example recipient
        const recipient = Keypair.generate();
        const amount = BigInt(100000); // 0.1 tokens with 6 decimals

        console.log(`Testing compressed token minting...`);
        console.log(`Recipient: ${recipient.publicKey.toBase58()}`);
        console.log(`Amount: ${amount.toString()}\n`);

        // Mint compressed tokens directly to recipient
        const mintSig = await createCompressedAccount(
            lightRpc,
            payer,
            recipient.publicKey,
            mint,
            amount
        );

        console.log("✓ Compressed tokens minted!");
        console.log(`Signature: ${mintSig}\n`);

        // Wait for Photon indexer to process the mint
        console.log("Waiting for indexer to process mint...");
        let balanceBefore = BigInt(0);
        let attempts = 0;
        const maxAttempts = 20;

        while (balanceBefore === BigInt(0) && attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            balanceBefore = await getCompressedBalance(
                lightRpc,
                recipient.publicKey,
                mint
            );
            attempts++;
            if (balanceBefore === BigInt(0)) {
                process.stdout.write(".");
            } else {
                console.log("\n✓ Tokens indexed!\n");
            }
        }

        if (balanceBefore === BigInt(0)) {
            console.log("\n⚠️  Indexer did not pick up tokens within timeout");
            console.log("This is normal on devnet - indexer can be slow");
            console.log("\nYou can verify the mint on Solana Explorer:");
            console.log(
                `https://explorer.solana.com/tx/${mintSig}?cluster=devnet\n`
            );
            return;
        }

        console.log(`Recipient 1 balance: ${balanceBefore.toString()}\n`);

        // Now transfer those tokens to another address
        const recipient2 = Keypair.generate();
        const transferAmount = BigInt(50000); // Transfer half

        console.log(`Testing compressed transfer...`);
        console.log(`From: ${recipient.publicKey.toBase58()}`);
        console.log(`To: ${recipient2.publicKey.toBase58()}`);
        console.log(`Amount: ${transferAmount.toString()}\n`);

        const transferSig = await transferCompressed(
            lightRpc,
            payer,
            recipient, // owner must sign
            recipient2.publicKey,
            mint,
            transferAmount
        );

        console.log("✓ Compressed transfer complete!");
        console.log(`Signature: ${transferSig}\n`);

        // Check balances
        const balance1 = await getCompressedBalance(
            lightRpc,
            recipient.publicKey,
            mint
        );
        const balance2 = await getCompressedBalance(
            lightRpc,
            recipient2.publicKey,
            mint
        );

        console.log("Final Balances:");
        console.log(`Recipient 1: ${balance1.toString()}`);
        console.log(`Recipient 2: ${balance2.toString()}`);
    } catch (error) {
        console.error("Error during compressed transfer:");
        console.error(error instanceof Error ? error.message : error);
        console.log("\n📚 Troubleshooting:");
        console.log(
            "1. Ensure PHOTON_RPC_URL is set in .env (Helius RPC with compression API)"
        );
        console.log("2. Verify you have SOL for transaction fees");
        console.log(
            "3. Check that Light Protocol programs are accessible on devnet"
        );
        console.log("\nSee TECHSPEC.md for full technical details.");
    }
}

main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
