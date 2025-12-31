import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Pool } from 'pg';

// Initialize database connection pool
const pool = new Pool({
  host: process.env.RDS_HOST,
  port: parseInt(process.env.RDS_PORT || '5432'),
  database: process.env.RDS_DATABASE,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const { httpMethod, path, pathParameters, queryStringParameters, body } = event;

  try {
    // Route handling
    if (httpMethod === 'GET' && path.includes('/campaigns')) {
      return await getCampaigns(pathParameters, queryStringParameters);
    }

    if (httpMethod === 'POST' && path.includes('/campaigns')) {
      return await createCampaign(body);
    }

    if (httpMethod === 'GET' && path.includes('/metrics')) {
      return await getMetrics(pathParameters, queryStringParameters);
    }

    if (httpMethod === 'POST' && path.includes('/clicks')) {
      return await trackClick(body);
    }

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Not Found' }),
    };
  } catch (error: any) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message,
      }),
    };
  }
};

async function getCampaigns(
  pathParameters: any,
  queryStringParameters: any
): Promise<APIGatewayProxyResult> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT * FROM campaigns WHERE organization_id = $1 ORDER BY created_at DESC',
      [queryStringParameters?.organization_id]
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ campaigns: result.rows }),
    };
  } finally {
    client.release();
  }
}

async function createCampaign(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  const client = await pool.connect();
  try {
    const { organization_id, name, target_contract, budget_usd, goal } = JSON.parse(body);

    const result = await client.query(
      `INSERT INTO campaigns (organization_id, name, target_contract, budget_usd, goal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [organization_id, name, target_contract, budget_usd, goal]
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ campaign: result.rows[0] }),
    };
  } finally {
    client.release();
  }
}

async function getMetrics(
  pathParameters: any,
  queryStringParameters: any
): Promise<APIGatewayProxyResult> {
  const client = await pool.connect();
  try {
    const projectId = pathParameters?.project_id || queryStringParameters?.project_id;

    const result = await client.query(
      `SELECT * FROM activity_metrics 
       WHERE project_id = $1 
       ORDER BY date DESC 
       LIMIT 30`,
      [projectId]
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ metrics: result.rows }),
    };
  } finally {
    client.release();
  }
}

async function trackClick(body: string | null): Promise<APIGatewayProxyResult> {
  if (!body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  // For high-frequency writes, use DynamoDB instead
  // This is a placeholder - implement DynamoDB write in production
  const { DynamoDBClient, PutItemCommand } = await import('@aws-sdk/client-dynamodb');

  try {
    const clickData = JSON.parse(body);
    const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });

    await dynamoClient.send(
      new PutItemCommand({
        TableName: process.env.CLICKS_TABLE_NAME,
        Item: {
          id: { S: clickData.click_id },
          timestamp: { N: Date.now().toString() },
          campaign_id: { S: clickData.campaign_id },
          ip_address: { S: clickData.ip_address || '' },
          user_agent: { S: clickData.user_agent || '' },
        },
      })
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ success: true }),
    };
  } catch (error: any) {
    console.error('DynamoDB error:', error);
    throw error;
  }
}

