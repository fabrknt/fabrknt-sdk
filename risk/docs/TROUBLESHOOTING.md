# Troubleshooting Guide

## Building the Project

### Quick Build

Use the provided build script that handles Rust version issues automatically:

```bash
npm run build
# or
./scripts/build.sh
```

The build script automatically:

-   Prioritizes system Rust (1.82.0) over Solana's bundled Rust (1.79.0)
-   Uses the global Anchor installation
-   Generates the program binary and IDL

## Running Tests

### Quick Test

Use the provided test script:

```bash
npm test
# or
./scripts/test.sh
```

**Note**: Tests require a local Solana validator to be running. Start it in a separate terminal:

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Run tests
npm test
```

The test script automatically:

-   Prioritizes system Rust over Solana's bundled Rust
-   Uses the global Anchor installation
-   Detects if a validator is already running and uses it

### Port 8899 Already in Use

If you see the error:

```
Error: Your configured rpc port: 8899 is already in use
```

This means a validator is already running. The test script will automatically detect and use it. If you want to use a different validator:

1. **Option 1**: Stop the existing validator and let Anchor start its own:

    ```bash
    # Find and kill the process
    lsof -ti:8899 | xargs kill
    npm test
    ```

2. **Option 2**: Use the existing validator (recommended):

    ```bash
    # The test script automatically detects and uses it
    npm test
    ```

3. **Option 3**: Use a different port:

    ```bash
    # Start validator on different port
    solana-test-validator --rpc-port 8900

    # Set environment variable
    export ANCHOR_PROVIDER_URL="http://localhost:8900"
    npm test
    ```

## Anchor Version Mismatch

If you encounter the error:

```
Globally installed anchor version is not correct. Expected "anchor-cli 0.31.2", found "anchor-cli 0.31.1".
```

This is a known issue where the npm package `@coral-xyz/anchor` expects a different CLI version than what's installed.

### Solution 1: Use the Build Script (Recommended)

The `scripts/build.sh` script automatically handles PATH configuration to use system Rust:

```bash
./scripts/build.sh
```

### Solution 2: Use Global Anchor Directly

Ensure your PATH prioritizes the global Anchor installation:

```bash
# Check which anchor is being used
which anchor

# If it's using the npm version, use the global one directly
# The global anchor is typically at: ~/.cargo/bin/anchor
~/.cargo/bin/anchor build
```

### Solution 3: Use npx with Global Anchor

```bash
# Remove npm anchor from PATH temporarily
export PATH=$(echo $PATH | tr ':' '\n' | grep -v node_modules | tr '\n' ':')
anchor build
```

### Solution 4: Align Versions

The project is configured for Anchor 0.31.1. If you need a different version:

1. Install the desired Anchor version:

    ```bash
    avm install <version>
    avm use <version>
    ```

2. Update `Anchor.toml`:

    ```toml
    [toolchain]
    anchor_version = "<version>"
    ```

3. Update `programs/risk/Cargo.toml`:

    ```toml
    anchor-lang = "<version>"
    anchor-spl = "<version>"
    ```

4. Update npm packages:
    ```bash
    npm install @coral-xyz/anchor@<version>
    ```

## Build Issues

### Rust Compilation Errors

If you get Rust compilation errors:

1. Update Rust:

    ```bash
    rustup update
    ```

2. Clean and rebuild:
    ```bash
    anchor clean
    anchor build
    ```

### Missing Dependencies

Install all dependencies:

```bash
# Root dependencies
npm install

# Workspace dependencies
npm install --workspaces

# Rust dependencies (via Anchor)
anchor build
```

## API Server Issues

### Port Already in Use

Change the port in `api/.env`:

```
PORT=3001
```

### Missing Environment Variables

Copy the example file:

```bash
cd api
cp .env.example .env
# Edit .env with your configuration
```

## Solana CLI Issues

### Wrong Network

Check your Solana configuration:

```bash
solana config get
```

Set to the correct network:

```bash
solana config set --url <network-url>
```

### Insufficient Balance

Airdrop SOL for testing:

```bash
# Devnet
solana airdrop 2 <your-wallet-address> --url devnet

# Localnet
solana airdrop 2 <your-wallet-address> --url localhost
```
