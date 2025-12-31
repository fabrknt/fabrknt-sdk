import { EventBridgeEvent } from "aws-lambda";
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
});

/**
 * Daily metrics aggregation Lambda
 * Triggered by EventBridge cron schedule (runs daily at 2 AM UTC)
 */
export const handler = async (
    event: EventBridgeEvent<string, any>
): Promise<void> => {
    console.log("Metrics aggregation event:", JSON.stringify(event, null, 2));

    const client = await pool.connect();
    try {
        // Calculate DAU/WAU/MAU for each project
        const projects = await client.query(
            "SELECT DISTINCT project_id FROM activity_metrics"
        );

        for (const project of projects.rows) {
            const projectId = project.project_id;
            const today = new Date().toISOString().split("T")[0];

            // Calculate DAU (Daily Active Users)
            const dauResult = await client.query(
                `SELECT COUNT(DISTINCT wallet_address) as dau
         FROM contract_interactions
         WHERE project_id = $1
         AND timestamp >= CURRENT_DATE`,
                [projectId]
            );

            // Calculate WAU (Weekly Active Users)
            const wauResult = await client.query(
                `SELECT COUNT(DISTINCT wallet_address) as wau
         FROM contract_interactions
         WHERE project_id = $1
         AND timestamp >= CURRENT_DATE - INTERVAL '7 days'`,
                [projectId]
            );

            // Calculate MAU (Monthly Active Users)
            const mauResult = await client.query(
                `SELECT COUNT(DISTINCT wallet_address) as mau
         FROM contract_interactions
         WHERE project_id = $1
         AND timestamp >= CURRENT_DATE - INTERVAL '30 days'`,
                [projectId]
            );

            // Calculate transaction volume
            const volumeResult = await client.query(
                `SELECT COALESCE(SUM(value_usd), 0) as volume, COUNT(*) as tx_count
         FROM contract_interactions
         WHERE project_id = $1
         AND timestamp >= CURRENT_DATE`,
                [projectId]
            );

            // Calculate activity score (0-100)
            const activityScore = calculateActivityScore(
                parseInt(dauResult.rows[0].dau),
                parseInt(wauResult.rows[0].wau),
                parseInt(mauResult.rows[0].mau),
                parseFloat(volumeResult.rows[0].volume),
                parseInt(volumeResult.rows[0].tx_count)
            );

            // Insert or update metrics
            await client.query(
                `INSERT INTO activity_metrics 
         (project_id, date, dau, wau, mau, transaction_count, transaction_volume_usd, activity_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (project_id, date) 
         DO UPDATE SET
           dau = EXCLUDED.dau,
           wau = EXCLUDED.wau,
           mau = EXCLUDED.mau,
           transaction_count = EXCLUDED.transaction_count,
           transaction_volume_usd = EXCLUDED.transaction_volume_usd,
           activity_score = EXCLUDED.activity_score`,
                [
                    projectId,
                    today,
                    parseInt(dauResult.rows[0].dau),
                    parseInt(wauResult.rows[0].wau),
                    parseInt(mauResult.rows[0].mau),
                    parseInt(volumeResult.rows[0].tx_count),
                    parseFloat(volumeResult.rows[0].volume),
                    activityScore,
                ]
            );

            console.log(`Updated metrics for project ${projectId}:`, {
                dau: dauResult.rows[0].dau,
                wau: wauResult.rows[0].wau,
                mau: mauResult.rows[0].mau,
                activityScore,
            });
        }
    } catch (error) {
        console.error("Error aggregating metrics:", error);
        throw error;
    } finally {
        client.release();
    }
};

function calculateActivityScore(
    dau: number,
    wau: number,
    mau: number,
    volume: number,
    txCount: number
): number {
    // Simple scoring algorithm (0-100)
    // Weight: DAU (40%), WAU (30%), MAU (20%), Volume/Tx (10%)
    const dauScore = Math.min((dau / 1000) * 100, 40);
    const wauScore = Math.min((wau / 5000) * 100, 30);
    const mauScore = Math.min((mau / 20000) * 100, 20);
    const volumeScore = Math.min((volume / 100000) * 100, 10);

    return Math.round(dauScore + wauScore + mauScore + volumeScore);
}
