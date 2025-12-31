# AWS Architecture for Fabrknt Suite

## Overview

This document outlines the AWS-native architecture for PULSE, TRACE, and FABRIC using AWS managed services. All three products will be hosted on AWS Amplify, consistent with the main website deployment.

---

## Architecture Principles

1. **AWS-First**: Use AWS managed services wherever possible
2. **Serverless-First**: Leverage Lambda, API Gateway, and other serverless services
3. **Cost-Effective**: Optimize for cost while maintaining performance
4. **Scalable**: Design for horizontal scaling
5. **Secure**: Implement AWS security best practices

---

## Shared Infrastructure

### Frontend Hosting

-   **AWS Amplify Hosting**
    -   Next.js 14 applications for all three products
    -   Automatic CI/CD from GitHub
    -   Custom domains: `pulse.fabrknt.com`, `trace.fabrknt.com`, `fabric.fabrknt.com`
    -   Edge caching with CloudFront

### Authentication & Authorization

-   **Amazon Cognito**
    -   Wallet-based authentication (Solana/EVM)
    -   Custom authentication flow using Lambda triggers
    -   User pools per product or shared pool
    -   JWT tokens for API access

### API Layer

-   **Amazon API Gateway**
    -   RESTful APIs for all products
    -   Lambda integration for serverless functions
    -   Request/response transformation
    -   Rate limiting and throttling
    -   API keys for external integrations

### Database

-   **Amazon RDS PostgreSQL** (Primary)

    -   Multi-AZ for high availability
    -   Automated backups
    -   Read replicas for scaling
    -   Connection pooling with RDS Proxy

-   **Amazon DynamoDB** (Secondary)
    -   High-frequency writes (clicks, events)
    -   Time-series data (activity metrics)
    -   Global tables for low latency
    -   On-demand or provisioned capacity

### Caching

-   **Amazon ElastiCache (Redis)**
    -   Session storage
    -   High-speed click tracking
    -   Real-time metrics caching
    -   Rate limiting counters

### Storage

-   **Amazon S3**
    -   Static assets
    -   User uploads (avatars, documents)
    -   Data exports
    -   Logs and backups

### Message Queue & Event Processing

-   **Amazon EventBridge**

    -   Event-driven architecture
    -   Cross-service communication
    -   Scheduled tasks (cron jobs)

-   **Amazon SQS**
    -   Async task processing
    -   Dead letter queues for error handling

### Background Workers

-   **AWS Lambda**
    -   On-chain data indexing
    -   Webhook processing
    -   Scheduled jobs (EventBridge triggers)
    -   Data aggregation and analytics

### Monitoring & Logging

-   **Amazon CloudWatch**

    -   Application logs
    -   Metrics and alarms
    -   Dashboards

-   **AWS X-Ray**
    -   Distributed tracing
    -   Performance monitoring

### Secrets Management

-   **AWS Secrets Manager**
    -   API keys
    -   Database credentials
    -   Third-party service tokens

---

## Product-Specific Architecture

## TRACE Architecture

### Components

#### Frontend

-   **AWS Amplify Hosting** (Next.js 14)
-   **Domain**: `trace.fabrknt.com`

#### Database Schema (RDS PostgreSQL)

```sql
-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  target_contract TEXT,
  budget_usd DECIMAL(15,2),
  goal TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clicks (high-frequency, use DynamoDB for real-time)
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  click_id TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  utm_params JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Conversions
CREATE TABLE conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id UUID REFERENCES clicks(id),
  wallet_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  value_usd DECIMAL(15,2),
  contract_address TEXT,
  event_type TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Metrics (time-series, consider DynamoDB)
CREATE TABLE activity_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  date DATE NOT NULL,
  dau INTEGER DEFAULT 0,
  wau INTEGER DEFAULT 0,
  mau INTEGER DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  transaction_volume_usd DECIMAL(15,2) DEFAULT 0,
  activity_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, date)
);

-- Contract Interactions
CREATE TABLE contract_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID,
  wallet_address TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  function_name TEXT,
  value_usd DECIMAL(15,2),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

#### API Endpoints (API Gateway + Lambda)

-   `POST /api/v1/campaigns` - Create campaign
-   `GET /api/v1/campaigns/{id}` - Get campaign details
-   `POST /api/v1/clicks` - Track click (high-frequency)
-   `POST /api/v1/conversions` - Record conversion
-   `GET /api/v1/metrics/{project_id}` - Get activity metrics
-   `GET /api/v1/roi/{campaign_id}` - Calculate ROI
-   `GET /api/v1/growth-certificate/{project_id}` - For FABRIC integration

#### Background Workers (Lambda)

1. **On-Chain Indexer**

    - Triggered by EventBridge (every 1-5 minutes)
    - Monitors blockchain events (Solana/EVM)
    - Updates conversions and activity metrics
    - Uses Alchemy/Helius webhooks

2. **Metrics Aggregator**

    - Scheduled daily via EventBridge
    - Calculates DAU/WAU/MAU
    - Updates activity scores
    - Generates growth certificates

3. **Bot Detection Worker**
    - Analyzes wallet patterns
    - Flags suspicious activity
    - Updates quality scores

#### High-Speed Click Tracking

-   **DynamoDB** for click storage (high write throughput)
-   **ElastiCache Redis** for real-time counters
-   **Lambda@Edge** or **CloudFront Functions** for edge-level tracking

#### External Integrations

-   **Alchemy** (EVM chains) - Webhook integration via Lambda
-   **Helius** (Solana) - DAS API & Webhooks via Lambda
-   **The Graph** - Historical data queries via Lambda

---

## PULSE Architecture

### Components

#### Frontend

-   **AWS Amplify Hosting** (Next.js 14)
-   **Domain**: `pulse.fabrknt.com`

#### Database Schema (RDS PostgreSQL)

```sql
-- Teams
CREATE TABLE pulse_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) UNIQUE,
  team_name TEXT NOT NULL,
  pulse_id TEXT UNIQUE NOT NULL,
  vitality_score DECIMAL(5,2),
  developer_activity_score DECIMAL(5,2),
  team_retention_score DECIMAL(5,2),
  last_calculated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contributors
CREATE TABLE contributors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES pulse_teams(id),
  wallet_address TEXT NOT NULL,
  github_username TEXT,
  discord_id TEXT,
  contribution_score DECIMAL(10,2) DEFAULT 0,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, wallet_address)
);

-- Contributions (GitHub, Discord, etc.)
CREATE TABLE contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID REFERENCES contributors(id),
  platform TEXT NOT NULL CHECK (platform IN ('github', 'discord', 'notion')),
  contribution_type TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- SBT Issuance Records
CREATE TABLE sbt_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_id UUID REFERENCES contributors(id),
  chain TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_id TEXT NOT NULL,
  metadata_uri TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### API Endpoints (API Gateway + Lambda)

-   `GET /api/v1/teams/{pulse_id}` - Get team data
-   `GET /api/v1/contributors/{wallet}` - Get contributor score
-   `POST /api/v1/discord/webhook` - Ingest Discord activity
-   `POST /api/v1/github/webhook` - Ingest GitHub activity
-   `POST /api/v1/mint-sbt` - Trigger SBT minting
-   `GET /api/v1/vitality/{pulse_id}` - Get vitality score (for FABRIC)

#### Background Workers (Lambda)

1. **GitHub Activity Aggregator**

    - Triggered by GitHub webhooks
    - Processes PRs, reviews, commits
    - Calculates weighted contributions
    - Updates contributor scores

2. **Discord Activity Aggregator**

    - Triggered by Discord webhooks
    - Processes messages, reactions, interactions
    - Applies "Omotenashi" quality weighting
    - Updates contributor scores

3. **Score Calculator**

    - Scheduled daily via EventBridge
    - Recalculates team vitality scores
    - Updates developer activity metrics
    - Generates weekly reports

4. **SBT Minting Worker**
    - Triggered when milestones reached
    - Calls smart contract (via Lambda)
    - Records SBT issuance
    - Updates contributor profile

#### External Integrations

-   **GitHub API** - Webhook processing via Lambda
-   **Discord API** - Bot integration via Lambda
-   **Notion API** - Document tracking via Lambda
-   **Chainlink Functions** - On-chain score verification (if needed)

---

## FABRIC Architecture

### Components

#### Frontend

-   **AWS Amplify Hosting** (Next.js 14)
-   **Domain**: `fabric.fabrknt.com`

#### Database Schema (RDS PostgreSQL)

```sql
-- Listings
CREATE TABLE fabric_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  pulse_team_id UUID,
  trace_project_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  asking_price_usd DECIMAL(15,2),
  blockchain TEXT NOT NULL,
  fabrknt_score DECIMAL(5,2),
  growth_score DECIMAL(5,2),
  vitality_score DECIMAL(5,2),
  revenue_verified DECIMAL(15,2),
  status TEXT DEFAULT 'draft',
  visibility TEXT DEFAULT 'private',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ
);

-- Listing Assets
CREATE TABLE fabric_listing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES fabric_listings(id),
  asset_type TEXT NOT NULL,
  asset_identifier TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Escrow Transactions
CREATE TABLE escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES fabric_listings(id),
  buyer_wallet TEXT NOT NULL,
  seller_wallet TEXT NOT NULL,
  escrow_contract_address TEXT NOT NULL,
  amount_usd DECIMAL(15,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- NDAs (on-chain signatures)
CREATE TABLE nda_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES fabric_listings(id),
  buyer_wallet TEXT NOT NULL,
  signature TEXT NOT NULL,
  message TEXT NOT NULL,
  signed_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### API Endpoints (API Gateway + Lambda)

-   `GET /api/v1/suite/summary/{listing_id}` - Aggregate TRACE + PULSE data
-   `POST /api/v1/listings` - Create listing
-   `GET /api/v1/listings/{id}` - Get listing details
-   `POST /api/v1/escrow/init` - Initialize escrow
-   `POST /api/v1/nda/sign` - Sign NDA (on-chain)
-   `GET /api/v1/proof-of-funds/{wallet}` - Verify buyer funds

#### Background Workers (Lambda)

1. **Suite Data Aggregator**

    - Fetches data from TRACE and PULSE APIs
    - Calculates Fabrknt Score
    - Updates listing metrics
    - Triggered on listing creation/update

2. **Escrow Monitor**

    - Monitors escrow contract state
    - Updates transaction status
    - Handles completion events
    - Triggered by blockchain events

3. **Revenue Verifier**
    - Verifies on-chain protocol fees
    - Integrates with Stripe API (if applicable)
    - Updates verified revenue
    - Scheduled daily

#### Smart Contracts

-   **Escrow Contract** (Solana/Base)
    -   Atomic swap functionality
    -   Handles asset transfer
    -   Deployed via AWS Lambda (using Anchor/Foundry)

---

## Migration Strategy

### Phase 1: Infrastructure Setup

1. Set up AWS accounts and IAM roles
2. Create RDS PostgreSQL instances
3. Set up DynamoDB tables
4. Configure ElastiCache Redis clusters
5. Set up S3 buckets
6. Configure Secrets Manager

### Phase 2: Database Setup

1. Review database schema requirements
2. Create RDS schema (run migrations)
3. Set up initial data if needed
4. Set up RDS Proxy for connection pooling

### Phase 3: API Development

1. Create Lambda functions for each endpoint
2. Set up API Gateway
3. Configure Cognito for authentication
4. Implement wallet auth flow

### Phase 4: Background Workers

1. Set up EventBridge rules
2. Create Lambda workers
3. Configure SQS queues
4. Set up CloudWatch monitoring

### Phase 5: Frontend Setup

1. Set up Next.js apps to use AWS APIs
2. Configure AWS SDK clients
3. Set up authentication flow with Cognito
4. Deploy to Amplify

### Phase 6: Testing & Optimization

1. Load testing
2. Cost optimization
3. Performance tuning
4. Security audit

---

## Cost Estimation (Monthly)

### Small Scale (Startup)

-   **RDS PostgreSQL**: ~$50-100 (db.t3.micro, Multi-AZ)
-   **DynamoDB**: ~$25-50 (on-demand)
-   **ElastiCache Redis**: ~$15-30 (cache.t3.micro)
-   **Lambda**: ~$10-20 (1M requests)
-   **API Gateway**: ~$3.50 (1M requests)
-   **S3**: ~$5-10 (storage + requests)
-   **Amplify**: ~$15 (hosting)
-   **CloudWatch**: ~$10-20
-   **Total**: ~$130-250/month

### Medium Scale (Growth)

-   **RDS PostgreSQL**: ~$200-400 (db.t3.medium, Multi-AZ + read replica)
-   **DynamoDB**: ~$100-200
-   **ElastiCache Redis**: ~$60-120 (cache.t3.small)
-   **Lambda**: ~$50-100
-   **API Gateway**: ~$20-50
-   **S3**: ~$20-40
-   **Amplify**: ~$50
-   **CloudWatch**: ~$30-50
-   **Total**: ~$510-1010/month

---

## Security Considerations

1. **IAM Roles**: Least privilege access
2. **VPC**: Isolate RDS and ElastiCache in private subnets
3. **Encryption**: Enable encryption at rest and in transit
4. **Secrets**: Use Secrets Manager, never hardcode
5. **WAF**: Web Application Firewall for API Gateway
6. **Cognito**: MFA support for admin users
7. **CloudTrail**: Audit logging for compliance

---

## Monitoring & Observability

1. **CloudWatch Dashboards**: Custom dashboards per product
2. **X-Ray Tracing**: End-to-end request tracing
3. **Alarms**: Set up alerts for errors, latency, costs
4. **Logs**: Centralized logging with CloudWatch Logs
5. **Metrics**: Custom metrics for business KPIs

---

## Next Steps

1. Review and approve architecture
2. Set up AWS accounts and billing alerts
3. Create infrastructure as code (CDK/Terraform)
4. Begin Phase 1 implementation
5. Set up CI/CD pipelines
6. Create runbooks and documentation
