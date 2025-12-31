# Fabrknt Suite

> **Web3 Project Lifecycle Management** - From team vitality to growth tracking to M&A facilitation

The Fabrknt Suite is a comprehensive platform for Web3 projects, providing verified signals throughout the entire project lifecycle.

## 🏗️ Architecture

### Apps

- **[PULSE](./apps/pulse)** (port 3001) - Team Vitality Tracking
  - Decentralized contribution scoring across GitHub, Discord, and Notion
  - Qualitative "Omotenashi Logic" rewards quality over quantity
  - Soulbound Token (SBT) rewards for milestones
  - Weekly organizational health reports

- **[TRACE](./apps/trace)** (port 3002) - Marketing Attribution & Activity Monitoring
  - High-precision click-to-wallet attribution
  - On-chain conversion tracking (mint, swap, stake, vote)
  - Bot & Sybil detection
  - Service health metrics (DAU/WAU/MAU, Protocol Activity Score)

- **[FABRIC](./apps/fabric)** (port 3003) - M&A Terminal for Web3
  - Verified project listings with PULSE + TRACE data
  - Fabrknt Score composite metric
  - One-click NDA with wallet signatures
  - Atomic escrow for secure asset transfers

### Shared Packages

- **[@fabrknt/ui](./packages/ui)** - Shared React components (Shadcn UI + Radix)
- **[@fabrknt/auth](./packages/auth)** - Cognito + wallet authentication
- **[@fabrknt/db](./packages/db)** - Prisma client and database utilities
- **[@fabrknt/api](./packages/api)** - API utilities, error handling, validation
- **[@fabrknt/blockchain](./packages/blockchain)** - Blockchain integrations (Solana + EVM)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd fabrknt

# 2. Copy environment variables
cp .env.example .env
cp apps/pulse/.env.example apps/pulse/.env.local
cp apps/trace/.env.example apps/trace/.env.local
cp apps/fabric/.env.example apps/fabric/.env.local

# 3. Install dependencies and setup infrastructure
pnpm setup

# 4. Apply database schema
pnpm db:push

# 5. Start all apps in development mode
pnpm dev
```

### Individual App Development

```bash
# Run only PULSE
pnpm pulse:dev

# Run only TRACE
pnpm trace:dev

# Run only FABRIC
pnpm fabric:dev
```

## 🐳 Docker Services

Local development uses Docker Compose for PostgreSQL and Redis:

```bash
# Start services
pnpm docker:up

# Stop services
pnpm docker:down

# View logs
pnpm docker:logs
```

**Available Services:**
- PostgreSQL: `localhost:5432` (user: `fabrknt`, password: `fabrknt_dev_password`)
- Redis: `localhost:6379`
- pgAdmin: `http://localhost:5050` (admin@fabrknt.local / admin)
- Redis Commander: `http://localhost:8081`

## 📊 Database

The suite uses a shared PostgreSQL database managed by Prisma.

### Common Commands

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (dev)
pnpm db:push

# Create migration
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio
```

### Schema Overview

The database is organized into three main sections:

1. **PULSE Models**: `User`, `Organization`, `Contribution`, `Praise`, `SBTToken`, `HealthScore`
2. **TRACE Models**: `Campaign`, `Click`, `Conversion`, `ActivityMetrics`, `ContractInteraction`
3. **FABRIC Models**: `Listing`, `SuiteRibbonData`, `NDASignature`, `ProofOfFunds`, `Escrow`

See [packages/db/prisma/schema.prisma](./packages/db/prisma/schema.prisma) for full schema.

## 🏃 Development Workflow

### Code Quality

```bash
# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check

# Run both
pnpm check

# Format code
pnpm format
```

### Build

```bash
# Build all apps and packages
pnpm build

# Build specific app
pnpm --filter @fabrknt/pulse build
```

## 📦 Monorepo Structure

```
fabrknt/
├── apps/
│   ├── pulse/           # Team vitality tracking app
│   ├── trace/           # Marketing attribution app
│   └── fabric/          # M&A terminal app
├── packages/
│   ├── ui/              # Shared UI components
│   ├── auth/            # Authentication utilities
│   ├── db/              # Database & Prisma client
│   ├── api/             # API utilities
│   └── blockchain/      # Blockchain integrations
├── infrastructure/      # Infrastructure scripts
├── docker-compose.yml   # Local development services
├── turbo.json          # Turborepo configuration
└── pnpm-workspace.yaml # pnpm workspace config
```

## 🔐 Environment Variables

Each app requires specific environment variables:

### Shared (all apps)
- `DATABASE_URL` - PostgreSQL connection string
- `COGNITO_*` - AWS Cognito configuration

### PULSE Specific
- `GITHUB_*` - GitHub App credentials
- `DISCORD_*` - Discord bot credentials
- `CHAINLINK_*` - Chainlink Functions for SBT minting

### TRACE Specific
- `ALCHEMY_*` - Alchemy API for EVM event tracking
- `HELIUS_*` - Helius API for Solana event tracking
- `REDIS_URL` - Redis connection string

### FABRIC Specific
- `PULSE_API_*` - PULSE API integration
- `TRACE_API_*` - TRACE API integration
- Escrow contract addresses

See `.env.example` files for complete configuration.

## 🚢 Deployment

All three apps are designed to deploy on AWS Amplify with the following AWS services:

- **Frontend**: AWS Amplify
- **Backend**: AWS Lambda + API Gateway
- **Database**: Amazon RDS PostgreSQL
- **Cache**: Amazon ElastiCache Redis (TRACE only)
- **Auth**: Amazon Cognito
- **Storage**: Amazon S3
- **Monitoring**: Amazon CloudWatch

See individual app `amplify.yml` files for deployment configurations.

## 📝 Tech Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI + Radix UI
- Recharts/Nivo (charts)
- TanStack Query
- Zustand (state management)

### Backend
- Node.js 20
- Prisma ORM
- PostgreSQL 16
- Redis 7
- Zod (validation)

### Blockchain
- Solana Web3.js
- Viem (EVM)
- Alchemy SDK
- Helius DAS API

### DevOps
- Turborepo (monorepo)
- pnpm (package manager)
- Docker Compose (local dev)
- AWS Amplify (deployment)

## 🗺️ Roadmap

### Phase 0: Foundation ✅
- [x] Monorepo setup
- [x] Shared packages
- [x] Database schema
- [x] Basic app structure
- [x] Docker environment

### Phase 1: TRACE Implementation (Weeks 3-8)
- [ ] Core attribution engine
- [ ] On-chain event processing
- [ ] Activity monitoring (DAU/WAU/MAU)
- [ ] Link redirection service

### Phase 2: PULSE Implementation (Weeks 9-14)
- [ ] Contribution tracking
- [ ] Platform integrations (GitHub, Discord, Notion)
- [ ] Omotenashi scoring algorithm
- [ ] SBT minting

### Phase 3: FABRIC Implementation (Weeks 15-20)
- [ ] Listing engine
- [ ] Suite Ribbon integration
- [ ] Atomic escrow contracts
- [ ] NDA & Proof of Funds

### Phase 4: Integration & Polish (Weeks 21-24)
- [ ] Cross-app integration
- [ ] Analytics & monitoring
- [ ] Documentation
- [ ] Beta testing

### Phase 5: Production Launch (Week 25+)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Staged rollout (TRACE → PULSE → FABRIC)

## 🤝 Contributing

This is a private monorepo. For development:

1. Create a feature branch from `master`
2. Make your changes
3. Run `pnpm check` before committing
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues or questions, please contact the development team.

---

**Built with ❤️ by the Fabrknt team**
