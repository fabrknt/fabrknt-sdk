import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Flow } from "../target/types/flow";
import { PublicKey, Keypair, SystemProgram, Connection } from "@solana/web3.js";
import { expect } from "chai";
import { BN } from "@coral-xyz/anchor";
import {
    TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

/**
 * Raydium CLMM Validation Test Suite
 *
 * This test suite validates Flow's Raydium CLMM CPI integration with real pools.
 *
 * PREREQUISITES:
 * 1. Set up devnet environment
 * 2. Find a real Raydium CLMM pool on devnet
 * 3. Update POOL_CONFIG below with pool information
 * 4. Ensure test wallet has SOL and tokens
 */

describe("Raydium CLMM Validation", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.flow as Program<Flow>;
    const connection = provider.connection;

    // ============================================================================
    // CONFIGURATION - UPDATE WITH REAL POOL INFORMATION
    // ============================================================================

    const RAYDIUM_CLMM_PROGRAM_ID = new PublicKey(
        "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK"
    );

    // TODO: Update these with real devnet pool information
    const POOL_CONFIG = {
        poolState: new PublicKey("REPLACE_WITH_REAL_POOL_STATE_ADDRESS"),
        tokenMint0: new PublicKey("REPLACE_WITH_TOKEN_MINT_0"),
        tokenMint1: new PublicKey("REPLACE_WITH_TOKEN_MINT_1"),
        tokenVault0: new PublicKey("REPLACE_WITH_TOKEN_VAULT_0"),
        tokenVault1: new PublicKey("REPLACE_WITH_TOKEN_VAULT_1"),
        tickSpacing: 60, // Usually 60 for Raydium CLMM
        currentTick: 0, // Update with actual current tick
    };

    // Test accounts
    let owner: Keypair;
    let protocolConfig: PublicKey;

    before(async () => {
        // Generate test owner
        owner = Keypair.generate();

        // Airdrop SOL to owner
        try {
            const airdropTx = await connection.requestAirdrop(
                owner.publicKey,
                2 * anchor.web3.LAMPORTS_PER_SOL
            );
            await connection.confirmTransaction(airdropTx);
        } catch (err) {
            console.warn(
                "Airdrop failed (rate limit?), ensure wallet has SOL:",
                err
            );
        }

        // Derive protocol config PDA
        [protocolConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from("protocol_config")],
            program.programId
        );

        // Initialize protocol config if needed
        try {
            await program.account.protocolConfig.fetch(protocolConfig);
        } catch {
            try {
                const authority = Keypair.generate();
                await connection.requestAirdrop(
                    authority.publicKey,
                    2 * anchor.web3.LAMPORTS_PER_SOL
                );
                await connection.confirmTransaction(
                    await connection.requestAirdrop(
                        authority.publicKey,
                        2 * anchor.web3.LAMPORTS_PER_SOL
                    )
                );

                await program.methods
                    .initializeProtocolConfig(500, 100, new BN(1000))
                    .accounts({
                        authority: authority.publicKey,
                        feeRecipient: authority.publicKey,
                    })
                    .signers([authority])
                    .rpc();
            } catch (err) {
                console.warn("Failed to initialize protocol config:", err);
            }
        }
    });

    describe("PDA Derivation Validation", () => {
        it("Should derive Position PDA correctly", async () => {
            // This test compares our PDA derivation with Raydium's expected format
            // TODO: Use Raydium SDK to derive PDAs and compare

            const positionIndex = 0;
            const poolState = POOL_CONFIG.poolState;
            const ownerPubkey = owner.publicKey;

            // Our derivation (from Flow program)
            // Note: This should match Raydium's derivation
            const [positionPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("position"),
                    poolState.toBuffer(),
                    ownerPubkey.toBuffer(),
                    Buffer.from(
                        new BN(positionIndex).toArrayLike(Buffer, "le", 2)
                    ),
                ],
                RAYDIUM_CLMM_PROGRAM_ID
            );

            console.log("Derived Position PDA:", positionPda.toString());

            // TODO: Compare with Raydium SDK derivation
            // const raydiumPositionPda = derivePositionPda(poolState, ownerPubkey, positionIndex);
            // expect(positionPda.toString()).to.equal(raydiumPositionPda.toString());
        });

        it("Should derive TickArray PDA correctly", async () => {
            const tickLower = -1000;
            const tickSpacing = POOL_CONFIG.tickSpacing;
            const poolState = POOL_CONFIG.poolState;

            // Normalize tick to tick spacing
            const normalizedTick =
                Math.floor(tickLower / tickSpacing) * tickSpacing;

            // Our derivation
            const [tickArrayPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("tick_array"),
                    poolState.toBuffer(),
                    Buffer.from(
                        new BN(normalizedTick).toArrayLike(Buffer, "le", 4)
                    ),
                ],
                RAYDIUM_CLMM_PROGRAM_ID
            );

            console.log("Derived TickArray PDA:", tickArrayPda.toString());

            // TODO: Compare with Raydium SDK derivation
        });
    });

    describe("Position Creation Validation", () => {
        it.skip("Should create position on real Raydium pool", async () => {
            // SKIP: Requires real pool configuration and tokens
            // Uncomment and configure when ready to test

            const positionIndex = 0;
            const tickLower = -1000;
            const tickUpper = 1000;
            const priceLower = new BN("1000000000000000000");
            const priceUpper = new BN("2000000000000000000");
            const maxPositionSize = new BN("100000000000");
            const maxSingleTrade = new BN("10000000000");

            // Derive PDAs
            const [liquidityPosition] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("liquidity_position"),
                    owner.publicKey.toBuffer(),
                    Buffer.from([positionIndex]),
                ],
                program.programId
            );

            const [raydiumPositionPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("position"),
                    POOL_CONFIG.poolState.toBuffer(),
                    owner.publicKey.toBuffer(),
                    Buffer.from(new BN(0).toArrayLike(Buffer, "le", 2)),
                ],
                RAYDIUM_CLMM_PROGRAM_ID
            );

            // Normalize ticks
            const normalizedTickLower =
                Math.floor(tickLower / POOL_CONFIG.tickSpacing) *
                POOL_CONFIG.tickSpacing;
            const normalizedTickUpper =
                Math.floor(tickUpper / POOL_CONFIG.tickSpacing) *
                POOL_CONFIG.tickSpacing;

            const [tickArrayLowerPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("tick_array"),
                    POOL_CONFIG.poolState.toBuffer(),
                    Buffer.from(
                        new BN(normalizedTickLower).toArrayLike(Buffer, "le", 4)
                    ),
                ],
                RAYDIUM_CLMM_PROGRAM_ID
            );

            const [tickArrayUpperPda] = PublicKey.findProgramAddressSync(
                [
                    Buffer.from("tick_array"),
                    POOL_CONFIG.poolState.toBuffer(),
                    Buffer.from(
                        new BN(normalizedTickUpper).toArrayLike(Buffer, "le", 4)
                    ),
                ],
                RAYDIUM_CLMM_PROGRAM_ID
            );

            // Get or create token accounts
            const tokenAccount0 = await getAssociatedTokenAddress(
                POOL_CONFIG.tokenMint0,
                owner.publicKey
            );

            const tokenAccount1 = await getAssociatedTokenAddress(
                POOL_CONFIG.tokenMint1,
                owner.publicKey
            );

            // Check if token accounts exist, create if needed
            const account0Info = await connection.getAccountInfo(tokenAccount0);
            if (!account0Info) {
                // Create token account 0
                const createIx0 = createAssociatedTokenAccountInstruction(
                    owner.publicKey,
                    tokenAccount0,
                    owner.publicKey,
                    POOL_CONFIG.tokenMint0
                );
                // Would need to send transaction here
            }

            const account1Info = await connection.getAccountInfo(tokenAccount1);
            if (!account1Info) {
                // Create token account 1
                const createIx1 = createAssociatedTokenAccountInstruction(
                    owner.publicKey,
                    tokenAccount1,
                    owner.publicKey,
                    POOL_CONFIG.tokenMint1
                );
                // Would need to send transaction here
            }

            // TODO: Ensure token accounts have balance before proceeding

            try {
                const tx = await program.methods
                    .createLiquidityPosition(
                        positionIndex,
                        POOL_CONFIG.tokenMint0,
                        POOL_CONFIG.tokenMint1,
                        tickLower,
                        tickUpper,
                        priceLower,
                        priceUpper,
                        maxPositionSize,
                        maxSingleTrade
                    )
                    .accounts({
                        position: liquidityPosition,
                        config: protocolConfig,
                        owner: owner.publicKey,
                        tokenAVault: SystemProgram.programId, // Placeholder
                        tokenBVault: SystemProgram.programId, // Placeholder
                        pool: POOL_CONFIG.poolState,
                        auditLog: SystemProgram.programId, // Placeholder
                        raydiumProgram: RAYDIUM_CLMM_PROGRAM_ID,
                        raydiumPoolState: POOL_CONFIG.poolState,
                        raydiumPersonalPosition: raydiumPositionPda,
                        raydiumTickArrayLower: tickArrayLowerPda,
                        raydiumTickArrayUpper: tickArrayUpperPda,
                        raydiumTokenAccount0: tokenAccount0,
                        raydiumTokenAccount1: tokenAccount1,
                        raydiumTokenVault0: POOL_CONFIG.tokenVault0,
                        raydiumTokenVault1: POOL_CONFIG.tokenVault1,
                        tokenProgram: TOKEN_PROGRAM_ID,
                        systemProgram: SystemProgram.programId,
                    })
                    .signers([owner])
                    .rpc();

                console.log("Position creation tx:", tx);
                console.log(
                    "View on explorer:",
                    `https://explorer.solana.com/tx/${tx}?cluster=devnet`
                );

                // Verify position was created
                const positionAccount =
                    await program.account.liquidityPosition.fetch(
                        liquidityPosition
                    );
                expect(positionAccount.owner.toString()).to.equal(
                    owner.publicKey.toString()
                );
            } catch (err) {
                console.error("Position creation failed:", err);
                throw err;
            }
        });
    });

    describe("Helper Functions", () => {
        it("Should provide helper to find Raydium pools", async () => {
            // This is a placeholder for a helper function that finds Raydium pools
            // In practice, you would:
            // 1. Query Raydium API
            // 2. Use Raydium SDK
            // 3. Query program accounts

            console.log("To find Raydium pools:");
            console.log(
                "1. Use Raydium SDK: new Raydium(connection).getClmmPools()"
            );
            console.log(
                "2. Query Raydium API: https://api.raydium.io/v2/clmmPools"
            );
            console.log(
                "3. Use Solana Explorer to find accounts created by Raydium CLMM program"
            );
        });
    });
});
