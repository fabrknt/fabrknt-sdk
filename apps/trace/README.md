# Product Requirements Document: TRACE

## 1. Project Overview

**Project Name:** TRACE (Part of the Fabrknt Suite)

**Domain:** `trace.fabrknt.com`

**Concept:** A high-precision Web3 marketing attribution and "Ad-Audit" tool with comprehensive on-chain activity monitoring capabilities.

**Role in Suite:** **Growth Verification.** It proves to potential buyers on FABRIC that a project's user acquisition is real, efficient, and bot-free. Additionally, it demonstrates that the service is actively being used through comprehensive on-chain activity monitoring.

---

## 2. Branding & Aesthetic (The Fabrknt Suite Standard)

-   **Visual Identity:** Consistent with `www.fabrknt.com`. Minimalist, monochromatic, and architectural.
-   **UX Goal:** "Information Density with Clarity." Use a clean grid system to present complex data without clutter.
-   **Typography:** Bold geometric headers with light-weight data values to emphasize the "Measured" precision.

---

## 3. Core Features (The Growth Audit Engine)

### 3.1. Web3 Attribution Engine

-   **Click-to-Wallet Mapping:** A lightweight tracking script that associates off-chain marketing links (X, Discord, Telegram) with specific wallet addresses upon connection.
-   **UTM for Web3:** Support for custom parameters to track specific influencers, campaigns, or community raids.

### 3.2. On-chain Conversion Tracking (The ROI Proof)

-   **Event Monitoring:** Real-time monitoring of specific smart contract interactions (e.g., `Mint`, `Swap`, `Stake`, `Vote`).
-   **Conversion Attribution:** Directly link a $50,000 swap or a rare NFT mint back to the specific marketing dollar spent.
-   **Multi-Chain Support:** Initial focus on high-velocity chains like **Base**, **Solana**, and **Astar**.

### 3.3. Bot & Sybil Auditing

-   **Wallet Hygiene Check:** Flagging "empty" or "just-created" wallets to identify bot-driven marketing inflation.
-   **Retention Analysis:** Tracking if acquired wallets stay active or dump assets immediately (Loyalty Score).

### 3.4. General On-Chain Activity Monitoring

-   **Protocol Activity Tracking:** Monitor all on-chain activity regardless of marketing attribution, providing comprehensive visibility into service usage and adoption.
-   **Service Health Metrics:** Real-time tracking of key activity indicators:
    -   Daily/Weekly/Monthly Active Users (DAU/WAU/MAU)
    -   Transaction volume and frequency
    -   Unique wallet interactions
    -   Smart contract interaction patterns
-   **Activity Trends:** Historical analysis showing growth, decline, or stability trends over time.
-   **Protocol Activity Score:** A composite metric (0-100) quantifying overall on-chain activity levels, proving that services are actively being used.
-   **Multi-Contract Monitoring:** Track activity across multiple smart contracts within a single protocol or ecosystem.

### 3.5. FABRIC Integration (The "Export to Exit" Feature)

-   **Verification API:** A dedicated endpoint that allows **fabric.https://www.google.com/search?q=fabrknt.com** to pull a "Growth Certificate."
-   **Trust Signal:** Listings on FABRIC will display a "TRACE-Verified ROI" badge, significantly increasing buyer confidence and valuation.

---

## 4. Technical Architecture

### 4.1. Technical Stack

-   **Frontend:** Next.js 14, Tailwind CSS, Shadcn UI.
-   **Hosting:** AWS Amplify Hosting (consistent with main website)
-   **Backend:** Amazon RDS PostgreSQL for attribution mapping; Amazon ElastiCache (Redis) for high-speed click tracking.
-   **API:** AWS API Gateway + Lambda for serverless APIs
-   **On-Chain Data:** \* **EVM:** Viem + Alchemy Custom Webhooks (processed via Lambda).
-   **Solana:** Helius Digital Asset Standard (DAS) API & Webhooks (processed via Lambda).
-   **Infrastructure:** AWS Lambda@Edge or CloudFront Functions for global low-latency link redirection.
-   **Authentication:** Amazon Cognito with wallet-based authentication
-   **Storage:** Amazon S3 for static assets and data exports
-   **Monitoring:** Amazon CloudWatch for logs and metrics

### 4.2. Database Schema (High Level)

-   `campaigns`: Owner, target contract, budget, goal.
-   `clicks`: Click ID, metadata (IP, Ref, UA), timestamp.
-   `conversions`: Wallet address, click ID, transaction hash, USD value at time of txn.
-   `activity_metrics`: Protocol-level activity tracking (DAU, WAU, MAU, transaction volume, activity score).
-   `contract_interactions`: All smart contract interactions regardless of marketing attribution.

---

## 5. Development Strategy (AI Prompts)

### Step 1: The Attribution Script

> "Create a lightweight JavaScript snippet that captures a URL parameter called 'fbk_id', stores it in local storage, and provides a function `getTraceId()` that can be called when a wallet is connected. The code must be under 2KB."

### Step 2: The On-chain Auditor

> "Develop a background worker in TypeScript using Viem. It should take a list of wallet addresses and a contract address, then scan the last 10,000 blocks for specific function calls made by those wallets. Return a summary of total volume and transaction count."

### Step 3: The Suite Dashboard

> "Design a dashboard for `trace.fabrknt.com` using the https://www.google.com/search?q=fabrknt.com aesthetic. It should feature a 'Verified ROI' summary card, a 'Protocol Activity Score' card showing overall service health, and a real-time table of on-chain conversions labeled 'Live Pulse of Growth'. Include activity trend charts showing DAU/WAU/MAU over time."

### Step 4: Activity Monitoring Worker

> "Develop a background worker that continuously monitors all on-chain activity for specified smart contracts. It should track transaction counts, unique wallets, volume, and calculate an Activity Score. Store metrics in time-series format for trend analysis. Support both campaign-attributed and general activity tracking."

---

## 6. Synergy Logic: The "Fabrknt Suite" Workflow

1. **Build:** You build a project.
2. **Operate (PULSE):** You track development activity to prove the team is "alive" and efficient.
3. **Grow (TRACE):** You run ads/marketing and prove that every $1 spent results in $X of on-chain volume. Additionally, you monitor all on-chain activity to demonstrate that your service is actively being used, regardless of marketing spend.
4. **Exit (FABRIC):** You list the project. The buyer sees **PULSE** data (Operational Health) and **TRACE** data (Growth Efficiency + Service Activity). The Activity Score proves the service has real usage, not just marketing-driven spikes.
5. **Result:** The "Information Asymmetry" is eliminated, leading to a faster close and a higher sale price.
