import { Keypair } from '@solana/web3.js';
import { verifyMessage } from 'ethers';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { SiweMessage } from 'siwe';
import type { WalletAuthPayload } from './types';

export class WalletAuthService {
  /**
   * Verify EVM wallet signature using SIWE (Sign-In with Ethereum)
   */
  async verifyEVMSignature(payload: WalletAuthPayload): Promise<boolean> {
    try {
      const siweMessage = new SiweMessage(payload.message);
      const fields = await siweMessage.verify({ signature: payload.signature });

      return fields.data.address.toLowerCase() === payload.walletAddress.toLowerCase();
    } catch (error) {
      console.error('EVM signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify Solana wallet signature
   */
  async verifySolanaSignature(payload: WalletAuthPayload): Promise<boolean> {
    try {
      const messageBytes = new TextEncoder().encode(payload.message);
      const signatureBytes = bs58.decode(payload.signature);
      const publicKeyBytes = bs58.decode(payload.walletAddress);

      return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
    } catch (error) {
      console.error('Solana signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify wallet signature based on chain type
   */
  async verifySignature(payload: WalletAuthPayload): Promise<boolean> {
    if (payload.chainType === 'evm') {
      return this.verifyEVMSignature(payload);
    } else if (payload.chainType === 'solana') {
      return this.verifySolanaSignature(payload);
    }

    return false;
  }

  /**
   * Generate a nonce message for wallet signature
   */
  generateNonceMessage(walletAddress: string, nonce: string): string {
    return `Sign this message to authenticate with Fabrknt Suite.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
  }
}
