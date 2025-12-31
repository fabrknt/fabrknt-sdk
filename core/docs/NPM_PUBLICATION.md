# npm Publication Guide

Complete guide for publishing `@fabrknt/sdk` to npm.

## Prerequisites

1. **npm Account**: Create an account at [npmjs.com](https://www.npmjs.com/)
2. **Organization**: Ensure `@fabrknt` organization exists on npm (or publish as scoped package)
3. **Authentication**: Login to npm via CLI

## Pre-Publication Checklist

### ✅ Package Configuration

-   [x] `package.json` configured with correct name (`@fabrknt/sdk`)
-   [x] Version follows semantic versioning (currently `0.3.0`)
-   [x] `main`, `module`, and `types` fields point to `dist/`
-   [x] `exports` field configured for ESM and CJS
-   [x] `files` field specifies what to include
-   [x] `publishConfig.access` set to `public`
-   [x] `.npmignore` configured to exclude unnecessary files

### ✅ Build Verification

-   [x] Build succeeds: `npm run build`
-   [x] TypeScript types generated correctly
-   [x] Both CJS and ESM formats built
-   [x] Source maps included

### ✅ Local Testing

-   [x] Package can be packed: `npm pack --dry-run`
-   [x] Package installs locally: `npm install ./fabrknt-sdk-0.3.0.tgz`
-   [x] CJS imports work: `require('@fabrknt/sdk')`
-   [x] ESM imports work: `import { ... } from '@fabrknt/sdk'`
-   [x] TypeScript types resolve correctly

## Publication Steps

### 1. Login to npm

```bash
npm login
```

Enter your npm credentials when prompted.

### 2. Verify Package Contents

```bash
# Dry run to see what will be published
npm pack --dry-run

# Create actual tarball for inspection
npm pack
tar -tzf fabrknt-sdk-0.3.0.tgz | head -20
```

Expected files:

-   `dist/index.js` (CJS)
-   `dist/index.mjs` (ESM)
-   `dist/index.d.ts` (TypeScript types)
-   `dist/index.d.mts` (ESM TypeScript types)
-   `dist/*.map` (Source maps)
-   `package.json`
-   `README.md`
-   `LICENSE` (if exists)

### 3. Test Local Installation

```bash
# Create test directory
mkdir -p /tmp/test-install
cd /tmp/test-install
npm init -y

# Install from local tarball
npm install /path/to/fabrknt/fabrknt-sdk-0.3.0.tgz

# Test CJS import
node -e "const { BatchPayoutPattern, Guard } = require('@fabrknt/sdk'); console.log('CJS works!');"

# Test ESM import
node --input-type=module -e "import { BatchPayoutPattern, Guard } from '@fabrknt/sdk'; console.log('ESM works!');"
```

### 4. Publish to npm

#### First Time Publication

```bash
# Ensure you're logged in
npm whoami

# Publish (will prompt for OTP if 2FA enabled)
npm publish --access public
```

#### Subsequent Publications

```bash
# Update version first
npm version patch  # 0.3.0 -> 0.3.1
npm version minor  # 0.3.0 -> 0.4.0
npm version major  # 0.3.0 -> 1.0.0

# Or edit package.json manually, then:
npm publish
```

### 5. Verify Publication

```bash
# Check package on npm
npm view @fabrknt/sdk

# Install from npm to verify
cd /tmp/test-install
npm install @fabrknt/sdk
node -e "const { BatchPayoutPattern } = require('@fabrknt/sdk'); console.log('✅ Published package works!');"
```

## Version Strategy

Follow [Semantic Versioning](https://semver.org/):

-   **MAJOR** (1.0.0): Breaking changes
-   **MINOR** (0.4.0): New features, backward compatible
-   **PATCH** (0.3.1): Bug fixes, backward compatible

### Current Status: Beta (0.x.x)

During beta:

-   Breaking changes allowed in MINOR versions
-   Focus on stability and feedback
-   After 1.0.0, follow strict semver

## Post-Publication

### 1. Update Documentation

-   [ ] Update README.md installation instructions
-   [ ] Update website (https://github.com/fabrknt/website) with npm install command
-   [ ] Update examples to use npm package
-   [ ] Announce on Twitter/X

### 2. Monitor

-   [ ] Check npm download stats
-   [ ] Monitor GitHub issues for installation problems
-   [ ] Review npm package page for accuracy

### 3. Version Management

-   [ ] Tag release in Git: `git tag v0.3.0`
-   [ ] Push tags: `git push --tags`
-   [ ] Create GitHub release with changelog

## Troubleshooting

### "Package name already exists"

If `@fabrknt/sdk` is taken:

-   Use `@fabrknt/sdk` (scoped package)
-   Or choose alternative name

### "You do not have permission"

-   Ensure you're logged in: `npm whoami`
-   Check organization membership
-   Verify `publishConfig.access: "public"` in package.json

### "2FA Required"

Enable 2FA on npm account, then use OTP when publishing:

```bash
npm publish --otp=123456
```

### "Package too large"

Current size: ~237 KB (acceptable)

-   If exceeds 1MB, consider:
    -   Removing source maps from production
    -   Splitting into multiple packages
    -   Using dynamic imports

## Package Size Optimization

Current package size: **237 KB** (unpacked: 1.2 MB)

To reduce size:

-   Remove source maps (not recommended for debugging)
-   Tree-shake unused code (already enabled)
-   Split into smaller packages (future consideration)

## CI/CD Integration (Future)

Consider automating publication:

```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
    release:
        types: [created]
jobs:
    publish:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  registry-url: "https://registry.npmjs.org"
            - run: npm ci
            - run: npm run build
            - run: npm publish --access public
              env:
                  NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## Resources

-   [npm Documentation](https://docs.npmjs.com/)
-   [Semantic Versioning](https://semver.org/)
-   [npm Package Best Practices](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
