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
        if (httpMethod === "GET" && path.includes("/suite/summary")) {
            return await getSuiteSummary(pathParameters);
        }

        if (httpMethod === "GET" && path.includes("/listings")) {
            return await getListings(queryStringParameters);
        }

        if (httpMethod === "POST" && path.includes("/listings")) {
            return await createListing(body);
        }

        if (httpMethod === "GET" && path.includes("/listings/")) {
            return await getListing(pathParameters);
        }

        if (httpMethod === "POST" && path.includes("/escrow/init")) {
            return await initEscrow(body);
        }

        if (httpMethod === "POST" && path.includes("/nda/sign")) {
            return await signNDA(body);
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

async function getSuiteSummary(
    pathParameters: any
): Promise<APIGatewayProxyResult> {
    const listingId = pathParameters?.listing_id;

    // Fetch data from TRACE and PULSE APIs
    const traceApiUrl = process.env.TRACE_API_URL || "";
    const pulseApiUrl = process.env.PULSE_API_URL || "";

    try {
        // This is a placeholder - implement actual API calls to TRACE and PULSE
        const [traceData, pulseData] = await Promise.all([
            fetch(`${traceApiUrl}/metrics/${listingId}`).then((r) => r.json()),
            fetch(`${pulseApiUrl}/teams/${listingId}`).then((r) => r.json()),
        ]);

        // Calculate Fabrknt Score
        const fabrkntScore = calculateFabrkntScore(traceData, pulseData);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({
                listing_id: listingId,
                fabrknt_score: fabrkntScore,
                trace_data: traceData,
                pulse_data: pulseData,
            }),
        };
    } catch (error: any) {
        console.error("Error fetching suite data:", error);
        throw error;
    }
}

function calculateFabrkntScore(traceData: any, pulseData: any): number {
    // Placeholder calculation
    // Implement actual scoring algorithm
    const growthScore = traceData?.activity_score || 0;
    const vitalityScore = pulseData?.vitality_score || 0;
    return growthScore * 0.6 + vitalityScore * 0.4;
}

async function getListings(
    queryStringParameters: any
): Promise<APIGatewayProxyResult> {
    const client = await pool.connect();
    try {
        const status = queryStringParameters?.status || "active";
        const result = await client.query(
            `SELECT * FROM fabric_listings 
       WHERE status = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
            [status]
        );

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ listings: result.rows }),
        };
    } finally {
        client.release();
    }
}

async function createListing(
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

    const client = await pool.connect();
    try {
        const listingData = JSON.parse(body);
        const result = await client.query(
            `INSERT INTO fabric_listings 
       (organization_id, pulse_team_id, trace_project_id, title, description, asking_price_usd, blockchain)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                listingData.organization_id,
                listingData.pulse_team_id,
                listingData.trace_project_id,
                listingData.title,
                listingData.description,
                listingData.asking_price_usd,
                listingData.blockchain,
            ]
        );

        return {
            statusCode: 201,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ listing: result.rows[0] }),
        };
    } finally {
        client.release();
    }
}

async function getListing(pathParameters: any): Promise<APIGatewayProxyResult> {
    const client = await pool.connect();
    try {
        const listingId = pathParameters?.id;
        const result = await client.query(
            "SELECT * FROM fabric_listings WHERE id = $1",
            [listingId]
        );

        if (result.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                },
                body: JSON.stringify({ error: "Listing not found" }),
            };
        }

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ listing: result.rows[0] }),
        };
    } finally {
        client.release();
    }
}

async function initEscrow(body: string | null): Promise<APIGatewayProxyResult> {
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

    // Placeholder for escrow initialization
    // This would deploy/initialize a smart contract
    const escrowData = JSON.parse(body);
    console.log("Initializing escrow:", escrowData);

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
            success: true,
            escrow_address: "0x...", // Placeholder
            message: "Escrow initialized",
        }),
    };
}

async function signNDA(body: string | null): Promise<APIGatewayProxyResult> {
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

    const client = await pool.connect();
    try {
        const { listing_id, buyer_wallet, signature, message } =
            JSON.parse(body);

        const result = await client.query(
            `INSERT INTO nda_signatures (listing_id, buyer_wallet, signature, message)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
            [listing_id, buyer_wallet, signature, message]
        );

        return {
            statusCode: 201,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ signature: result.rows[0] }),
        };
    } finally {
        client.release();
    }
}
