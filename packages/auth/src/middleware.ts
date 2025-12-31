import { APIGatewayProxyEvent } from 'aws-lambda';
import * as jose from 'jose';

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  user: {
    sub: string;
    email?: string;
    walletAddress?: string;
    username: string;
  };
}

/**
 * Middleware to verify JWT token from Cognito
 */
export async function verifyToken(token: string, jwksUri: string): Promise<any> {
  const JWKS = jose.createRemoteJWKSet(new URL(jwksUri));

  try {
    const { payload } = await jose.jwtVerify(token, JWKS, {
      issuer: jwksUri.replace('/.well-known/jwks.json', ''),
    });

    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

/**
 * Extract bearer token from Authorization header
 */
export function extractToken(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers.Authorization || event.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}
