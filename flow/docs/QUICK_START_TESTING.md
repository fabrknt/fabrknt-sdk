# Quick Start - Local Testing Guide

## Quick Test Setup

### Option 1: Automated Script (Recommended)

```bash
# Run the automated test script
./scripts/test-local.sh
```

This script will:

1. Start a local Solana validator
2. Configure Solana CLI
3. Airdrop SOL
4. Build and deploy the program
5. Run all integration tests
6. Clean up on exit

### Option 2: Manual Setup

#### Step 1: Start Local Validator

```bash
# Terminal 1: Start validator
solana-test-validator
```

#### Step 2: Configure CLI (New Terminal)

```bash
# Terminal 2: Configure and test
solana config set --url http://localhost:8899
solana airdrop 10
solana balance
```

#### Step 3: Build and Deploy

```bash
anchor build
anchor deploy
```

#### Step 4: Run Tests

```bash
anchor test --skip-local-validator
```

## Troubleshooting

### Validator Already Running

```bash
# Kill existing validator
pkill -f solana-test-validator

# Or use different port
solana-test-validator --rpc-port 8899
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8899

# Kill the process or use different port
```

### Insufficient Funds

```bash
# Request more SOL
solana airdrop 10
```

### Program Already Deployed

```bash
# Reset validator (will lose all state)
solana-test-validator --reset
```

## Useful Commands

```bash
# View validator logs
tail -f /tmp/solana-validator.log

# Check program account
solana account <PROGRAM_ID>

# View transaction logs
solana logs

# Get program ID
solana address -k target/deploy/flow-keypair.json
```

## Next Steps After Testing

1. Review test results
2. Fix any failing tests
3. Proceed with DEX integration (see `docs/DEX_INTEGRATION_PLAN.md`)
4. Review integration plans:
    - `docs/JUPITER_INTEGRATION.md`
    - `docs/RAYDIUM_INTEGRATION.md`

---

**Quick Reference**: Run `./scripts/test-local.sh` for automated testing
