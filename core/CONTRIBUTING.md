# Contributing to Fabrknt

Thank you for your interest in contributing to Fabrknt! This document provides guidelines and standards for contributing to the Precision Execution Stack for Solana.

## Table of Contents

-   [Code of Conduct](#code-of-conduct)
-   [Getting Started](#getting-started)
-   [Development Workflow](#development-workflow)
-   [Code Standards](#code-standards)
-   [Testing Requirements](#testing-requirements)
-   [Commit Guidelines](#commit-guidelines)
-   [Pull Request Process](#pull-request-process)
-   [Documentation](#documentation)

## Code of Conduct

-   Be respectful and constructive in all interactions
-   Focus on technical merit and project goals
-   Welcome newcomers and help them get started
-   Maintain a professional and collaborative environment

## Getting Started

### Prerequisites

-   Node.js 18+ and npm
-   TypeScript knowledge
-   Familiarity with Solana development
-   Understanding of blockchain security principles

### Setup

1. Fork the repository
2. Clone your fork:
    ```bash
    git clone https://github.com/YOUR_USERNAME/fabrknt.git
    cd fabrknt
    ```
3. Install dependencies:
    ```bash
    npm install
    ```
4. Run tests to ensure everything works:
    ```bash
    npm test
    ```
5. Run linter:
    ```bash
    npm run lint
    ```

## Development Workflow

**Note**: This project leverages AI-assisted development tools (GitHub Copilot, Cursor, ChatGPT) to maximize productivity. Contributors are encouraged to use AI tools for code generation, documentation, and testing while maintaining code quality and human review.

1. **Create a branch** for your feature or fix:

    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b fix/issue-description
    ```

2. **Make your changes** following the code standards below

    - Use AI tools for code generation, but always review and understand the generated code
    - AI-generated code must pass all tests and linting
    - Maintain code quality standards regardless of code source

3. **Write or update tests** for your changes

    - Use AI to generate test cases, but ensure comprehensive coverage
    - Test both success and failure scenarios

4. **Run the test suite** to ensure nothing breaks:

    ```bash
    npm test
    npm run lint
    ```

5. **Commit your changes** following the commit guidelines

6. **Push to your fork** and create a pull request

## Code Standards

### TypeScript

-   Use **strict TypeScript** - the project uses strict mode
-   Provide **explicit types** for all public APIs
-   Avoid `any` types unless absolutely necessary
-   Use **readonly** for immutable data structures
-   Export types from `src/types/index.ts` for shared interfaces

### File Organization

```
src/
├── core/           # Core orchestration (Fabrknt class)
├── guard/          # Security layer (see: github.com/fabrknt/guard)
├── pulsar/         # Risk assessment (backward compat: still named Pulsar, see: github.com/fabrknt/risk)
├── fabric/         # Performance & Privacy layer (see: github.com/fabrknt/privacy)
├── loom/           # Liquidity engine (see: github.com/fabrknt/loom)
└── types/          # Shared TypeScript types
```

### Naming Conventions

-   **Classes**: PascalCase (e.g., `Guard`, `FabricCore`)
-   **Functions/Methods**: camelCase (e.g., `validateTransaction`, `weave`)
-   **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_SLIPPAGE`)
-   **Interfaces**: PascalCase with descriptive names (e.g., `GuardConfig`, `Transaction`)
-   **Files**: kebab-case (e.g., `detector.ts`, `validator.ts`)

### Code Style

-   Use **2 spaces** for indentation
-   Use **double quotes** for strings
-   Include **semicolons** at the end of statements
-   Maximum line length: **100 characters** (flexible for readability)
-   Use **async/await** for asynchronous operations (not Promise.then())
-   Add **JSDoc comments** for all public APIs

### ESLint

The project uses ESLint with TypeScript support. Run the linter before committing:

```bash
npm run lint
```

Key rules:

-   `@typescript-eslint/no-unused-vars` - No unused variables
-   `@typescript-eslint/require-await` - Async functions must use await
-   `@typescript-eslint/no-explicit-any` - Avoid `any` type
-   `@typescript-eslint/explicit-module-boundary-types` - Explicit return types

## Testing Requirements

### Writing Tests

-   Use **Vitest** for unit tests
-   Place tests in the `tests/` directory
-   Name test files with `.test.ts` suffix
-   Aim for **high test coverage** on critical paths
-   Test both success and failure cases

### Test Structure

```typescript
import { describe, it, expect } from "vitest";
import { Guard } from "../src/guard";

describe("Guard", () => {
    it("should validate transaction within slippage limits", () => {
        const guard = new Guard({ maxSlippage: 0.1 });
        const result = guard.validateTransaction(mockTransaction);
        expect(result.isValid).toBe(true);
    });

    it("should reject transaction exceeding slippage limits", () => {
        const guard = new Guard({ maxSlippage: 0.1 });
        const result = guard.validateTransaction(highSlippageTx);
        expect(result.isValid).toBe(false);
    });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## Commit Guidelines

We follow **Conventional Commits** for clear and consistent commit history.

### Commit Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

-   `feat`: New feature
-   `fix`: Bug fix
-   `docs`: Documentation changes
-   `style`: Code style changes (formatting, no logic change)
-   `refactor`: Code refactoring (no feature/fix)
-   `test`: Adding or updating tests
-   `chore`: Maintenance tasks (dependencies, build config)
-   `perf`: Performance improvements

### Scopes

-   `guard`: Guard security layer (see: github.com/fabrknt/guard)
-   `risk`: Risk assessment (Pulsar, see: github.com/fabrknt/risk)
-   `privacy`: Privacy layer (Arbor/FabricCore, see: github.com/fabrknt/privacy)
-   `loom`: Liquidity engine (see: github.com/fabrknt/loom)
-   `flow`: DEX integration (see: github.com/fabrknt/flow)
-   `core`: Core orchestration (Fabrknt class)
-   `types`: Type definitions
-   `docs`: Documentation
-   `tests`: Test suite

### Examples

```bash
feat(guard): add custom pattern detection for CPI calls

Implement support for user-defined security patterns to detect
suspicious Cross-Program Invocation patterns.

Closes #42

---

fix(risk): correct cache TTL calculation

The cache was expiring too early due to millisecond conversion error.

---

docs(readme): update installation instructions

Add npm and yarn installation commands to README.

---

refactor(fabric): simplify transaction optimization logic

Remove redundant conditional checks and improve readability.
```

## Pull Request Process

### Before Submitting

1. Ensure all tests pass (`npm test`)
2. Run the linter and fix all issues (`npm run lint`)
3. Update documentation if needed
4. Add tests for new features
5. Update CHANGELOG.md if applicable

### PR Title Format

Follow the same format as commit messages:

```
feat(guard): add support for custom validation rules
fix(risk): resolve race condition in cache updates
docs: improve Guard API documentation
```

### PR Description Template

```markdown
## Description

Brief description of what this PR does.

## Type of Change

-   [ ] Bug fix (non-breaking change fixing an issue)
-   [ ] New feature (non-breaking change adding functionality)
-   [ ] Breaking change (fix or feature causing existing functionality to change)
-   [ ] Documentation update

## Testing

Describe the tests you ran and how to reproduce them.

## Checklist

-   [ ] My code follows the project's code standards
-   [ ] I have performed a self-review of my code
-   [ ] I have commented my code, particularly in hard-to-understand areas
-   [ ] I have updated the documentation accordingly
-   [ ] My changes generate no new warnings or errors
-   [ ] I have added tests that prove my fix is effective or that my feature works
-   [ ] New and existing unit tests pass locally with my changes

## Related Issues

Closes #(issue number)
```

### Review Process

1. A maintainer will review your PR within a few days
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release

## Documentation

### Code Comments

-   Add **JSDoc comments** for all public APIs
-   Include `@param` and `@returns` tags
-   Provide usage examples for complex functions
-   **AI-Assisted Documentation**: Use AI tools to generate initial documentation, but always review and refine for accuracy and clarity

Example:

````typescript
/**
 * Validate a transaction against configured security rules
 * @param transaction - The transaction to validate
 * @returns Validation result with isValid flag and optional reasons
 * @example
 * ```typescript
 * const guard = new Guard({ maxSlippage: 0.1 });
 * const result = guard.validateTransaction(tx);
 * if (!result.isValid) {
 *   console.log('Validation failed:', result.reason);
 * }
 * ```
 */
public validateTransaction(transaction: Transaction): ValidationResult {
    // Implementation
}
````

### Documentation Files

-   Update relevant docs in `docs/` directory
-   Add examples to `examples/` for new features
-   Update README.md for significant changes
-   Keep CHANGELOG.md updated

### Component Documentation

Each major component has dedicated documentation:

-   **Guard**: `docs/GUARD.md` - Security layer documentation
-   **Risk**: `docs/RISK.md` - Risk assessment documentation
-   **Privacy**: `docs/PRIVACY.md` - Privacy layer documentation

Update these files when making changes to their respective components.

## Questions or Need Help?

-   Open an issue on GitHub
-   Tag your issue with `question` or `help wanted`
-   Provide context and relevant code snippets
-   Be patient and respectful

## License

By contributing to Fabrknt, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Fabrknt! Together we're weaving the future of autonomous finance on Solana.
