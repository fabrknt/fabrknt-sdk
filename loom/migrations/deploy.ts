// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's Anchor.toml.

import * as anchor from "@coral-xyz/anchor";

module.exports = async function (provider: anchor.AnchorProvider) {
  // Configure client to use the provider.
  anchor.setProvider(provider);

  // Loom programs (atomliq + yield_splitter) have no global state to
  // initialize. Lending pools and AMM pools are created per-asset-pair
  // via initialize_pool / initialize_amm instructions.
  console.log("Loom programs deployed successfully.");
  console.log("  atomliq:", anchor.workspace.Atomliq.programId.toBase58());
  console.log("  yield_splitter:", anchor.workspace.YieldSplitter.programId.toBase58());
  console.log("No global state to initialize — pools are created individually.");
};
