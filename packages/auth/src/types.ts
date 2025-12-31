// Authentication types

export interface WalletAuthPayload {
  walletAddress: string;
  chainType: 'solana' | 'evm';
  message: string;
  signature: string;
}

export interface CognitoUser {
  sub: string;
  email?: string;
  walletAddress?: string;
  username: string;
}

export interface AuthToken {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}
