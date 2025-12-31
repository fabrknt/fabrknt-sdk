# Product Requirements Document: PULSE

## 1. Project Overview

**Project Name:** PULSE (Part of the Fabrknt Suite)

**Domain:** `pulse.fabrknt.com`

**Concept:** A decentralized contribution scoring and "Proof of Contribution" (PoC) protocol for DAOs and Web3 teams.

**Role in Suite:** **Operational Verification.** It proves to potential buyers on FABRIC that the project has a healthy, productive, and high-quality human capital foundation.

---

## 2. Branding & Aesthetic (The Fabrknt Suite Standard)

-   **Visual Identity:** "Human-centric but precise." While maintaining the monochromatic Fabrknt look, PULSE uses elegant data visualizations (e.g., contribution heatmaps, radar charts) to represent human effort.
-   **Tone:** Appreciative, Transparent, and Meritocratic. It moves away from "surveillance" (Web2) toward "recognition" (Web3).
-   **Typography:** Clean tabular data layouts that prioritize readability for reward distribution.

---

## 3. Core Functional Modules

### 3.1. Multi-Platform Connectivity (The Collectors)

-   **Discord Integration:** Track not just message volume, but high-value engagement (reactions received, helpfulness in support channels, onboarding assistance).
-   **GitHub Integration:** Monitor Pull Requests, code reviews, and documentation updates (beyond just commit counts).
-   **Notion/Docs Integration:** Track organizational contributions, such as meeting minutes and wiki updates.

### 3.2. Qualitative Scoring Algorithm (The "Omotenashi" Logic)

-   **Contribution Weighting:** A unique algorithm that rewards "Quality over Quantity."
-   _Example:_ A detailed technical documentation update is weighted higher than 100 "GM" messages.

-   **Peer Recognition:** Integration of slash commands (e.g., `/praise @user`) to allow community-driven qualitative boosts.

### 3.3. Proof of Contribution (PoC) Reports

-   **Weekly Pulse:** Automated summary reports for DAO leads showing the "Health Score" of the organization.
-   **Individual Builder Profiles:** A professional "on-chain resume" for every contributor showing their verified impact.

### 3.4. SBT (Soulbound Token) Issuance

-   **Automated Badging:** Upon reaching specific scoring milestones, PULSE automatically triggers the minting of non-transferable Soulbound Tokens (SBTs) to the contributor's wallet.
-   **Metadata:** The SBT contains the metadata of the specific contribution period, serving as a permanent record of merit.

### 3.5. FABRIC Integration (The "Team Vitality" Signal)

-   **Vitality Badge:** Listings on **fabric.https://www.google.com/search?q=fabrknt.com** pull data from PULSE to show the "Team Retention" and "Developer Activity" scores.
-   **Buyer Value:** Buyers can see that they are not just buying code, but an active, healthy ecosystem of contributors.

---

## 4. Technical Specifications

### 4.1. Tech Stack

-   **Frontend:** Next.js (App Router), Tailwind CSS.
-   **Hosting:** AWS Amplify Hosting (consistent with main website)
-   **Charts:** Recharts or Nivo (Customized for monochromatic/minimalist style).
-   **Backend:** Amazon RDS PostgreSQL for indexing off-chain activity (Discord/GitHub metadata).
-   **API:** AWS API Gateway + Lambda for serverless APIs
-   **Background Workers:** AWS Lambda triggered by EventBridge for scheduled tasks and webhooks
-   **Web3/SBT:** Cross-chain SBT minting engine (Base, Solana, or Polygon) using **Hardhat** or **Foundry** (deployed via Lambda).
-   **Oracles:** Integration with **Chainlink Functions** to bring off-chain contribution scores on-chain for minting.
-   **Authentication:** Amazon Cognito with wallet-based authentication
-   **Storage:** Amazon S3 for user uploads and reports
-   **Monitoring:** Amazon CloudWatch for logs and metrics

### 4.2. API & Webhooks

-   `GET /api/v1/score/{wallet}`: Returns the current contribution score.
-   `POST /api/v1/discord/webhook`: Ingests Discord activity logs.
-   `POST /api/v1/mint-sbt`: Triggers the on-chain badge issuance.

---

## 5. Development Strategy (AI Prompts)

### Step 1: The Activity Aggregator

> "Build a Node.js service that connects to the GitHub API. It should fetch the number of Pull Requests and Code Reviews for a specific repository over the last 30 days and return a JSON object that weights Reviews as 1.5x more valuable than commits."

### Step 2: The "Omotenashi" UI

> "Create a minimalist React component for a 'Contribution Heatmap'. Unlike GitHub's green squares, use a grayscale map consistent with the https://www.google.com/search?q=fabrknt.com design. It should show 'Active Days' and 'High Impact Actions' separately."

### Step 3: SBT Minting Logic

> "Draft a Solidity contract for a non-transferable Soulbound Token (SBT). It should have a function `issueBadge(address contributor, string memory metadataURI)` that can only be called by the PULSE platform owner."

---

## 6. The Fabrknt Suite: Unified Ecosystem

By completing **PULSE**, your suite now covers the entire Web3 project lifecycle:

-   **PULSE:** Proves the **Humans** are working (Vitality).
-   **TRACE:** Proves the **Marketing** is working (Growth).
-   **FABRIC:** Proves the **Value** is transferable (Exit).
