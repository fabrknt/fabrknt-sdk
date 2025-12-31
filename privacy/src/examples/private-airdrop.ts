/**
 * Example: Private Airdrop using Privacy SSM
 *
 * This demonstrates how to execute a private airdrop to multiple recipients.
 * Currently uses standard SPL tokens as a foundation, with notes on how to
 * integrate full ZK Compression for true privacy.
 */

import * as dotenv from "dotenv";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createConnection } from "../lib/connection";
import { PrivateAirdrop } from "../lib/airdrop";
import { AirdropRecipient, NetworkConfig } from "../types";
import bs58 from "bs58";

dotenv.config();

async function main() {
    console.log("=== Privacy SSM - Private Airdrop Demo ===\n");

    // 1. Setup network configuration
    const config: NetworkConfig = {
        rpcUrl: process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com",
        photonRpcUrl: process.env.PHOTON_RPC_URL,
        network: "devnet",
    };

    console.log("Network Configuration:");
    console.log(`- RPC: ${config.rpcUrl}`);
    console.log(`- Network: ${config.network}\n`);

    // 2. Load authority keypair
    const authorityPrivateKey = process.env.AIRDROP_AUTHORITY_PRIVATE_KEY;
    if (!authorityPrivateKey) {
        throw new Error("AIRDROP_AUTHORITY_PRIVATE_KEY not set in .env file");
    }

    const authorityKeypair = Keypair.fromSecretKey(
        bs58.decode(authorityPrivateKey)
    );
    console.log(`Authority: ${authorityKeypair.publicKey.toBase58()}\n`);

    // 3. Setup token mint
    const mintAddress = process.env.MINT_ADDRESS;
    if (!mintAddress) {
        console.log(
            "⚠️  MINT_ADDRESS not set - you need to create a token mint first"
        );
        console.log("Run: spl-token create-token");
        console.log("Then: spl-token mint <MINT_ADDRESS> <AMOUNT>\n");
        return;
    }

    const mint = new PublicKey(mintAddress);
    console.log(`Token Mint: ${mint.toBase58()}\n`);

    // 4. Define recipients
    // In production, you'd load this from a CSV or database
    const recipients: AirdropRecipient[] = [
        {
            address: new PublicKey(
                "AthWrtSNbNo7FzhVK4JjbKYFkX7QjpZvLUD4mncfpATc"
            ),
            amount: BigInt(1000000), // 1 token (assuming 6 decimals)
            metadata: {
                label: "Early Adopter",
                eligibilityReason: "Held tokens > 90 days",
            },
        },
        {
            address: new PublicKey(
                "8Gj8m3x9jVrRvx7vWtnEuyp9EA9DDXTc5QeyGnn5ZaYr"
            ),
            amount: BigInt(500000), // 0.5 tokens
            metadata: {
                label: "Active User",
                eligibilityReason: "Transaction count > 100",
            },
        },
        {
            address: new PublicKey(
                "fDnacNwRzUXa4rX1feMR1QvYzQgS6yz8cnpzDpFXTQH"
            ),
            amount: BigInt(2500000), // 2.5 tokens
            metadata: {
                label: "Power User",
                eligibilityReason: "Top 10% by volume",
            },
        },
    ];

    console.log(`Recipients: ${recipients.length}`);
    console.log("Sample recipients:");
    recipients.slice(0, 3).forEach((r, i) => {
        console.log(
            `  ${i + 1}. ${r.address.toBase58().slice(0, 8)}... - ${
                r.amount
            } units`
        );
    });
    console.log();

    // 5. Create connection and airdrop instance
    const connection = createConnection(config);

    // Check authority balance
    const balance = await connection.getBalance(authorityKeypair.publicKey);
    console.log(`Authority SOL balance: ${balance / 1e9} SOL`);
    if (balance < 1e8) {
        console.log(
            "⚠️  Low SOL balance - you may need more SOL for transaction fees"
        );
        console.log(
            `Run: solana airdrop 1 ${authorityKeypair.publicKey.toBase58()}\n`
        );
    }
    console.log();

    // 6. Execute airdrop
    const airdrop = new PrivateAirdrop(connection, {
        mint,
        authorityKeypair,
        recipients,
        batchSize: 5,
        useCompression: false, // Set to true for ZK Compression (requires full setup)
    });

    console.log("--- Starting Airdrop ---\n");

    try {
        const results = await airdrop.execute();

        console.log("\n--- Airdrop Results ---");
        console.log(`Total: ${results.length}`);
        console.log(`Successful: ${results.filter((r) => r.success).length}`);
        console.log(`Failed: ${results.filter((r) => !r.success).length}`);

        // Show failed transactions
        const failed = results.filter((r) => !r.success);
        if (failed.length > 0) {
            console.log("\nFailed transactions:");
            failed.forEach((f) => {
                console.log(
                    `  ${f.recipient.toBase58().slice(0, 8)}...: ${f.error}`
                );
            });
        }

        console.log("\n✓ Airdrop complete!");
    } catch (error) {
        console.error("Error executing airdrop:", error);
        process.exit(1);
    }
}

// Run the example
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
