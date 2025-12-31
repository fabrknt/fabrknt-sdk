import { Connection, PublicKey, Keypair } from '@solana/web3.js';
import { Wallet } from '@solana/wallet-adapter-base';
import axios, { AxiosInstance } from 'axios';
import nacl from 'tweetnacl';

export interface PulsarClientConfig {
  apiUrl: string;
  rpcUrl?: string;
  wallet?: Wallet;
}

export interface PaymentQuote {
  endpoint: string;
  price: {
    amount: string;
    currency: string;
    decimals: number;
  };
  recipient: string;
  network: string;
  programId: string;
}

export interface RwaRiskData {
  tokenMint: string;
  timestamp: string;
  metrics: {
    legalCompliance: {
      status: string;
      jurisdiction: string;
      structure: string;
      lastVerified: string;
    };
    counterpartyRisk: {
      issuerRating: string;
      defaultProbability: number;
      solvencyScore: number;
      lastUpdated: string;
    };
    oracleIntegrity: {
      consensusNodes: number;
      dataReliability: number;
      latency: string;
      lastUpdate: string;
    };
  };
  requestedBy: string;
}

/**
 * Pulsar Client SDK for x402 Protocol
 */
export class PulsarClient {
  private apiClient: AxiosInstance;
  private connection: Connection;
  private wallet?: Wallet;

  constructor(config: PulsarClientConfig) {
    this.apiClient = axios.create({
      baseURL: config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.connection = new Connection(
      config.rpcUrl || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    this.wallet = config.wallet;
  }

  /**
   * Get payment quote for an endpoint
   */
  async getPaymentQuote(endpoint: string = 'default'): Promise<PaymentQuote> {
    const response = await this.apiClient.get('/api/v1/payment/quote', {
      params: { endpoint },
    });
    return response.data;
  }

  /**
   * Create authentication headers for x402 protocol
   */
  private async createAuthHeaders(message: string): Promise<Record<string, string>> {
    if (!this.wallet || !this.wallet.adapter.publicKey) {
      throw new Error('Wallet not connected');
    }

    const publicKey = this.wallet.adapter.publicKey;
    const timestamp = Date.now().toString();
    
    // Sign message with wallet
    const messageBytes = new TextEncoder().encode(message);
    const signature = await this.wallet.adapter.signMessage?.(messageBytes);
    
    if (!signature) {
      throw new Error('Failed to sign message');
    }

    return {
      'x-wallet-address': publicKey.toBase58(),
      'x-message': message,
      'x-timestamp': timestamp,
      'x-payment-signature': Buffer.from(signature).toString('base64'),
    };
  }

  /**
   * Get RWA risk data for a token
   */
  async getRwaRiskData(tokenMint: string): Promise<RwaRiskData> {
    const message = `GET /api/v1/data/rwa-risk/${tokenMint} ${Date.now()}`;
    const headers = await this.createAuthHeaders(message);

    const response = await this.apiClient.get(
      `/api/v1/data/rwa-risk/${tokenMint}`,
      { headers }
    );

    return response.data;
  }

  /**
   * Get liquidation parameters for a token
   */
  async getLiquidationParams(tokenMint: string): Promise<any> {
    const message = `GET /api/v1/data/liquidation-params/${tokenMint} ${Date.now()}`;
    const headers = await this.createAuthHeaders(message);

    const response = await this.apiClient.get(
      `/api/v1/data/liquidation-params/${tokenMint}`,
      { headers }
    );

    return response.data;
  }

  /**
   * Verify payment transaction
   */
  async verifyPayment(signature: string, nonce: number): Promise<boolean> {
    const response = await this.apiClient.post('/api/v1/payment/verify', {
      signature,
      nonce,
    });

    return response.data.verified === true;
  }
}

export default PulsarClient;

