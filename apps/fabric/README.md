# Product Requirements Document: FABRIC

## 1. Project Overview

**Project Name:** FABRIC (Powered by Fabrknt)

**Domain:** `fabric.fabrknt.com`

**Concept:** The premium M&A terminal for Web3, powered by the **Fabrknt Suite**.

**Role in Suite:** **The Exit Layer.** FABRIC leverages automated data from **TRACE** and **PULSE** to eliminate information asymmetry and facilitate high-trust Web3 business transfers.

---

## 2. Design System & Aesthetics (The Suite Standard)

-   **Visual Identity:** Full consistency with `www.fabrknt.com`.
-   **The "Suite Ribbon":** Every listing features a dedicated data ribbon displaying real-time health signals from TRACE and PULSE.
-   **Minimalist Architecture:** The UI must feel like a "Financial Terminal"—functional, fast, and devoid of "Crypto-hype" visuals.

---

## 3. Core Functional Modules (The Exit Terminal)

### 3.1. Verified Listing Engine (The Synthesis)

-   **Automated Data Import:** Instead of manual entry, sellers link their **TRACE** (Marketing ROI + Service Activity) and **PULSE** (Team Vitality) IDs.
-   **The "Fabrknt Score":** An aggregate score calculated from:
-   **Growth (TRACE):** On-chain conversion efficiency, wallet quality, and service activity metrics (DAU/WAU/MAU, activity score).
-   **Vitality (PULSE):** Team contribution consistency and developer activity.
-   **Revenue:** Verified on-chain protocol fees or Stripe data.

### 3.2. Buyer Interface (High-Fidelity DD)

-   **The "Audit View":** Buyers can deep-dive into the raw data provided by TRACE and PULSE without leaving the FABRIC interface.
-   **One-Click NDA:** Buyers sign an on-chain message to unlock "Privileged Data" (GitHub private repos, specific smart contract addresses).
-   **Proof of Funds (PoF):** Access to high-value listings is gated by a wallet-balance check to ensure only serious buyers engage.

### 3.3. Transaction Protocol (The Deal Fabric)

-   **Atomic Escrow:** A smart contract-based swap where the purchase price (Stablecoins) is exchanged for project assets.
-   **Asset Packaging:**
-   **Smart Contract Ownership:** Transfer of `Admin/Owner` roles.
-   **Digital Assets:** ENS domains, GitHub organization access, and Social accounts.

---

## 4. Enhanced Synergy Features (Integration with Suite)

| Integration | Data Point Shared with FABRIC                                                          | Impact on Valuation                                                                  |
| ----------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **TRACE**   | Verified On-chain ROI / Marketing efficiency + Service activity metrics (DAU/WAU/MAU). | Proves the product is "market-fit", scalable, and actively being used by real users. |
| **PULSE**   | Team contribution score / SBT-verified history.                                        | Reduces "Key Person Risk" by proving a healthy team.                                 |

---

## 5. Technical Specifications

### 5.1. Tech Stack

-   **Frontend:** Next.js 14, Tailwind CSS, Shadcn UI.
-   **Hosting:** AWS Amplify Hosting (consistent with main website)
-   **Backend:** Amazon RDS PostgreSQL as the central hub for the Suite.
-   **API:** AWS API Gateway + Lambda for serverless APIs
-   **Background Workers:** AWS Lambda triggered by EventBridge for data aggregation and monitoring
-   **Blockchain:** \* **Escrow:** Custom Solidity/Rust contracts for atomic swaps (deployed via Lambda).
-   **Validation:** Cross-chain API calls to verify TRACE/PULSE on-chain badges (SBTs) via Lambda.
-   **Authentication:** Amazon Cognito with wallet-based authentication
-   **Storage:** Amazon S3 for listing assets and documents
-   **Monitoring:** Amazon CloudWatch for logs and metrics

### 5.2. Unified API Structure

-   `GET /api/v1/suite/summary/{listing_id}`: Aggregates stats from `trace.fabrknt.com` and `pulse.fabrknt.com`.
-   `POST /api/v1/escrow/init`: Deploys a new escrow instance for a deal.

---

## 6. Implementation Strategy (AI Prompts)

### Step 1: The "Suite Ribbon" Component

> "Create a React component called `SuiteRibbon`. It should display three key metrics: 'Growth (from TRACE)', 'Vitality (from PULSE)', and 'Verified Revenue'. Use the minimalist design of https://www.google.com/search?q=fabrknt.com. Each metric should have a 'Verified' checkmark icon that links to the respective subdomain for the audit report."

### Step 2: The Multi-Source Listing Form

> "Build a multi-step form for `fabric.fabrknt.com`. Step 1: Connect Wallet. Step 2: Enter TRACE Project ID. Step 3: Enter PULSE Team ID. The form should then call the APIs of these subdomains to auto-populate the project's performance data."

### Step 3: Atomic Swap Escrow

> "Write a Solidity smart contract for an atomic swap. The buyer deposits USDC. The seller deposits an NFT representing the project's ownership. The contract releases the USDC to the seller only when the NFT is successfully transferred to the buyer."

---

## 7. The Fabrknt Ecosystem Vision

The update to **FABRIC** transforms it into the **Trust Anchor** of the ecosystem.

1. **TRACE** tracks the value creation (marketing ROI + service activity).
2. **PULSE** tracks the human effort.
3. **FABRIC** facilitates the value transfer.
