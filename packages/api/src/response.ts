import { APIGatewayProxyResult } from 'aws-lambda';
import type { ApiResponse } from './types';

/**
 * Create a successful API response
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string
): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(response),
  };
}

/**
 * Create an error API response
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any,
  requestId?: string
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(response),
  };
}
