import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
} from '@solana/spl-token';
import { Rpc } from '@lightprotocol/stateless.js';
import { transferCompressed, ensureTokenPool } from './compressed-account';
import { AirdropRecipient, AirdropResult, AirdropConfig } from '../types';

/**
 * Executes a private airdrop to multiple recipients
 *
 * This implementation uses standard SPL tokens as a starting point.
 * For true privacy with ZK Compression, this would:
 * 1. Compress the source tokens into a shielded pool
 * 2. Generate ZK proofs for each transfer
 * 3. Distribute compressed tokens that hide amounts and recipients
 */
export class PrivateAirdrop {
  private connection: Connection;
  private config: AirdropConfig;
  private lightRpc?: Rpc;

  constructor(connection: Connection, config: AirdropConfig, lightRpc?: Rpc) {
    this.connection = connection;
    this.config = config;
    this.lightRpc = lightRpc;

    // If compression is enabled, lightRpc is required
    if (config.useCompression && !lightRpc) {
      throw new Error('Light Protocol RPC is required when useCompression is true');
    }
  }

  /**
   * Executes the airdrop to all recipients
   */
  async execute(): Promise<AirdropResult[]> {
    const results: AirdropResult[] = [];
    const batchSize = this.config.batchSize || 10;

    console.log(`Starting airdrop to ${this.config.recipients.length} recipients`);
    console.log(`Batch size: ${batchSize}`);
    console.log(`Using compression: ${this.config.useCompression}`);

    // Process in batches to avoid overwhelming the network
    for (let i = 0; i < this.config.recipients.length; i += batchSize) {
      const batch = this.config.recipients.slice(i, i + batchSize);
      const batchResults = await this.processBatch(batch, i / batchSize + 1);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < this.config.recipients.length) {
        await this.delay(1000);
      }
    }

    const successful = results.filter(r => r.success).length;
    console.log(`\nAirdrop complete: ${successful}/${results.length} successful`);

    return results;
  }

  /**
   * Processes a batch of recipients
   */
  private async processBatch(
    recipients: AirdropRecipient[],
    batchNumber: number
  ): Promise<AirdropResult[]> {
    console.log(`\nProcessing batch ${batchNumber} (${recipients.length} recipients)`);

    if (this.config.useCompression) {
      return this.processCompressedBatch(recipients);
    } else {
      return this.processStandardBatch(recipients);
    }
  }

  /**
   * Processes batch using standard SPL token transfers
   */
  private async processStandardBatch(
    recipients: AirdropRecipient[]
  ): Promise<AirdropResult[]> {
    const results: AirdropResult[] = [];

    for (const recipient of recipients) {
      try {
        const signature = await this.sendStandardTransfer(
          recipient.address,
          recipient.amount
        );

        results.push({
          signature,
          recipient: recipient.address,
          amount: recipient.amount,
          success: true,
        });

        console.log(`✓ Sent ${recipient.amount} to ${recipient.address.toBase58().slice(0, 8)}...`);
      } catch (error) {
        results.push({
          signature: '',
          recipient: recipient.address,
          amount: recipient.amount,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        console.log(`✗ Failed for ${recipient.address.toBase58().slice(0, 8)}...: ${error}`);
      }
    }

    return results;
  }

  /**
   * Processes batch using ZK compressed transfers
   * This uses Light Protocol to transfer compressed tokens with privacy
   */
  private async processCompressedBatch(
    recipients: AirdropRecipient[]
  ): Promise<AirdropResult[]> {
    if (!this.lightRpc) {
      throw new Error('Light RPC not initialized for compressed transfers');
    }

    const results: AirdropResult[] = [];

    console.log('Using ZK Compression for private transfers');
    console.log('Each transfer:');
    console.log('  - Fetches Merkle proofs from Photon API');
    console.log('  - Generates ZK proofs client-side');
    console.log('  - Submits only 128 bytes on-chain\n');

    // Ensure token pool exists for this mint
    try {
      await ensureTokenPool(
        this.lightRpc,
        this.config.authorityKeypair,
        this.config.mint
      );
    } catch (error) {
      console.log(`Token pool check: ${error}`);
    }

    // Process each recipient with compressed transfers
    for (const recipient of recipients) {
      try {
        const signature = await transferCompressed(
          this.lightRpc,
          this.config.authorityKeypair,  // payer
          this.config.authorityKeypair,  // owner
          recipient.address,
          this.config.mint,
          recipient.amount
        );

        results.push({
          signature,
          recipient: recipient.address,
          amount: recipient.amount,
          success: true,
        });

        console.log(`✓ Sent ${recipient.amount} compressed to ${recipient.address.toBase58().slice(0, 8)}...`);
      } catch (error) {
        results.push({
          signature: '',
          recipient: recipient.address,
          amount: recipient.amount,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        console.log(`✗ Failed for ${recipient.address.toBase58().slice(0, 8)}...: ${error}`);
      }

      // Add small delay between transfers
      await this.delay(500);
    }

    return results;
  }

  /**
   * Sends a standard SPL token transfer
   */
  private async sendStandardTransfer(
    recipient: PublicKey,
    amount: bigint
  ): Promise<string> {
    // Get or create source token account
    const sourceAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.config.authorityKeypair,
      this.config.mint,
      this.config.authorityKeypair.publicKey
    );

    // Get or create recipient token account
    const recipientAccount = await getOrCreateAssociatedTokenAccount(
      this.connection,
      this.config.authorityKeypair,
      this.config.mint,
      recipient
    );

    // Create transfer instruction
    const transferInstruction = createTransferInstruction(
      sourceAccount.address,
      recipientAccount.address,
      this.config.authorityKeypair.publicKey,
      Number(amount),
      [],
      TOKEN_PROGRAM_ID
    );

    // Create and send transaction
    const transaction = new Transaction().add(transferInstruction);
    const signature = await sendAndConfirmTransaction(
      this.connection,
      transaction,
      [this.config.authorityKeypair],
      { commitment: 'confirmed' }
    );

    return signature;
  }

  /**
   * Helper to add delay between operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validates the airdrop configuration
   */
  static validate(config: AirdropConfig): void {
    if (config.recipients.length === 0) {
      throw new Error('No recipients specified');
    }

    if (config.batchSize && config.batchSize < 1) {
      throw new Error('Batch size must be at least 1');
    }

    // Check for duplicate recipients
    const addresses = new Set<string>();
    for (const recipient of config.recipients) {
      const key = recipient.address.toBase58();
      if (addresses.has(key)) {
        throw new Error(`Duplicate recipient: ${key}`);
      }
      addresses.add(key);
    }
  }
}
