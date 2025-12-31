import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Pool } from "pg";

const pool = new Pool({
    host: process.env.RDS_HOST,
    port: parseInt(process.env.RDS_PORT || "5432"),
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
    console.log("Event:", JSON.stringify(event, null, 2));

    const { httpMethod, path, pathParameters, queryStringParameters, body } =
        event;

    try {
        if (httpMethod === "GET" && path.includes("/teams")) {
            return await getTeam(pathParameters);
        }

        if (httpMethod === "GET" && path.includes("/contributors")) {
            return await getContributor(pathParameters, queryStringParameters);
        }

        if (httpMethod === "POST" && path.includes("/webhook/discord")) {
            return await handleDiscordWebhook(body);
        }

        if (httpMethod === "POST" && path.includes("/webhook/github")) {
            return await handleGitHubWebhook(body);
        }

        if (httpMethod === "POST" && path.includes("/mint-sbt")) {
            return await mintSBT(body);
        }

        return {
            statusCode: 404,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Not Found" }),
        };
    } catch (error: any) {
        console.error("Error:", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                error: "Internal Server Error",
                message: error.message,
            }),
        };
    }
};

async function getTeam(pathParameters: any): Promise<APIGatewayProxyResult> {
    const client = await pool.connect();
    try {
        const pulseId = pathParameters?.pulse_id;
        const result = await client.query(
            `SELECT t.*, o.name as organization_name
       FROM pulse_teams t
       JOIN organizations o ON t.organization_id = o.id
       WHERE t.pulse_id = $1`,
            [pulseId]
        );

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({ error: "Team not found" }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ team: result.rows[0] }),
        };
    } finally {
        client.release();
    }
}

async function getContributor(
    pathParameters: any,
    queryStringParameters: any
): Promise<APIGatewayProxyResult> {
    const client = await pool.connect();
    try {
        const walletAddress =
            pathParameters?.wallet || queryStringParameters?.wallet;

        const result = await client.query(
            `SELECT c.*, t.pulse_id, t.team_name
       FROM contributors c
       JOIN pulse_teams t ON c.team_id = t.id
       WHERE c.wallet_address = $1`,
            [walletAddress]
        );

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ contributors: result.rows }),
        };
    } finally {
        client.release();
    }
}

async function handleDiscordWebhook(
    body: string | null
): Promise<APIGatewayProxyResult> {
    if (!body) {
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Request body is required" }),
        };
    }

    // Process Discord webhook data
    // This is a placeholder - implement actual Discord webhook processing
    const webhookData = JSON.parse(body);
    console.log("Discord webhook:", webhookData);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ success: true }),
    };
}

async function handleGitHubWebhook(
    body: string | null
): Promise<APIGatewayProxyResult> {
    if (!body) {
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Request body is required" }),
        };
    }

    // Process GitHub webhook data
    const webhookData = JSON.parse(body);
    console.log("GitHub webhook:", webhookData);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ success: true }),
    };
}

async function mintSBT(body: string | null): Promise<APIGatewayProxyResult> {
    if (!body) {
        return {
            statusCode: 400,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ error: "Request body is required" }),
        };
    }

    // Placeholder for SBT minting logic
    // This would call a smart contract via Lambda
    const { contributor_id, metadata_uri } = JSON.parse(body);
    console.log("Minting SBT for contributor:", contributor_id);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            success: true,
            message: "SBT minting initiated",
        }),
    };
}
