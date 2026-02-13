// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  const program = anchor.workspace.Flow;

  // Initialize protocol config PDA (one-time setup after deploy)
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("protocol_config")],
    program.programId
  );

  // Check if already initialized
  try {
    await program.account.protocolConfig.fetch(configPda);
    console.log("Protocol config already initialized at:", configPda.toBase58());
    return;
  } catch {
    // Not initialized yet, proceed
  }

  const feeRecipient = provider.wallet.publicKey; // Default fee recipient to deployer

  const tx = await program.methods
    .initializeProtocolConfig(
      100,           // performance_fee_bps: 1%
      50,            // protocol_fee_bps: 0.5%
      new anchor.BN(1_000_000) // x402_min_payment: 0.001 SOL
    )
    .accounts({
      config: configPda,
      authority: provider.wallet.publicKey,
      feeRecipient,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();

  console.log("Protocol config initialized. Tx:", tx);
  console.log("Config PDA:", configPda.toBase58());
};
