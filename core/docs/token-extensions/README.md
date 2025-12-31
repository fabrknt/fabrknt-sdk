# Token-2022 Extensions Documentation

Comprehensive guides for Token-2022 (SPL Token Extensions), with a focus on Transfer Hooks and security best practices.

---

## 📚 Guides

### [Transfer Hooks: Complete Guide](./transfer-hooks.md)

A comprehensive guide to Token-2022 Transfer Hooks, featuring an in-depth case study of Fragmetric's fragSOL implementation.

**Topics Covered**:
- What are Transfer Hooks?
- How Transfer Hooks work under the hood
- Fragmetric case study with on-chain analysis
- Implementation examples (Rust & TypeScript)
- Gas optimization techniques
- Integration with fabrknt Guard

**Perfect For**: Developers building tokens with custom transfer logic, protocol designers, and anyone integrating with Token-2022.

---

### [Security Patterns Reference](./security-patterns.md)

Practical security guide for Transfer Hook implementations, based on analysis of production protocols.

**Topics Covered**:
- 4 Transfer Hook attack patterns (P-105 to P-108)
- Real-world attack scenarios
- Detection logic and mitigation strategies
- Safe implementation checklists
- Integration best practices

**Perfect For**: Security-conscious developers, auditors, and teams integrating Transfer Hook tokens.

---

## 🚀 Quick Start

### Check if Token Has Transfer Hook

```typescript
import { getMint, getTransferHook } from "@solana/spl-token";

const mintInfo = await getMint(
  connection,
  mintAddress,
  'confirmed',
  TOKEN_2022_PROGRAM_ID
);

const hook = getTransferHook(mintInfo);

if (hook) {
  console.log("Token has Transfer Hook:", hook.programId.toString());
}
```

### Validate Transfer with Guard

```typescript
import { Guard } from "@fabrknt/sdk";

const guard = new Guard({
  validateTransferHooks: true,
  allowedHookPrograms: [
    "fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3"  // Fragmetric
  ]
});

const result = await guard.validateTransaction(tx);

if (!result.isValid) {
  console.error("Blocked:", result.blockedBy);
}
```

---

## 🔒 Security Patterns

fabrknt's Guard module detects 4 Transfer Hook security patterns:

| Pattern | Description | Severity |
|---------|-------------|----------|
| **P-105** | Malicious Transfer Hook | 🔴 Critical |
| **P-106** | Unexpected Hook Execution | ⚡ Alert |
| **P-107** | Hook Reentrancy | 🔴 Critical |
| **P-108** | Excessive Hook Accounts | ⚠️ Warning |

[Learn more about security patterns →](./security-patterns.md)

---

## 📖 Case Study: Fragmetric

**Token**: fragSOL (Liquid Restaking Token)
**Mint**: `FRAGSEthVFL7fdqM8hxfxkfCZzUvmg21cqPJVvC1qdbo`
**Hook Program**: `fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3`

Fragmetric uses Transfer Hooks to implement time-weighted reward distribution for Solana's first native liquid restaking protocol.

**Key Metrics**:
- 6 hook invocations per transfer
- ~17 accounts per invocation
- <$0.001 transaction cost
- ✅ Verified safe by fabrknt Guard

[Read full case study →](./transfer-hooks.md#case-study-fragmetrics-fragsol)

---

## 🛡️ Known Safe Hooks

fabrknt maintains a whitelist of verified Transfer Hook programs:

- **Fragmetric** - `fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3`
  - Purpose: Time-weighted reward distribution
  - Status: ✅ Production verified
  - Audit: Certora (2024)

Want to add your protocol to the whitelist? [Open an issue](https://github.com/fabrknt/fabrknt/issues).

---

## 🧪 Examples

### Safe Transfer Implementation

```typescript
async function safeTransfer(
  from: Keypair,
  to: PublicKey,
  amount: number,
  mint: PublicKey
) {
  // 1. Check for Transfer Hook
  const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
  const hook = getTransferHook(mintInfo);

  // 2. Build transfer
  const tx = new Transaction().add(
    createTransferCheckedInstruction(
      fromAta, mint, toAta,
      from.publicKey, amount, decimals,
      [], TOKEN_2022_PROGRAM_ID
    )
  );

  // 3. Validate if hook present
  if (hook) {
    const guard = new Guard({ validateTransferHooks: true });
    const result = await guard.validateTransaction(tx);

    if (!result.isValid) {
      throw new Error(`Validation failed: ${result.blockedBy}`);
    }
  }

  // 4. Execute
  return sendAndConfirmTransaction(connection, tx, [from]);
}
```

More examples in the [Transfer Hooks Guide](./transfer-hooks.md).

---

## 🔗 Related Documentation

- [Guard Module](../GUARD.md) - Security pattern detection
- [Token-2022 Official Docs](https://spl.solana.com/token-2022)
- [Transfer Hook Extension Spec](https://spl.solana.com/token-2022/extensions#transfer-hook)

---

## 💬 Community

Have questions or feedback?

- **Discord**: [Join our community](https://discord.gg/fabrknt)
- **GitHub Issues**: [Report bugs or request features](https://github.com/fabrknt/fabrknt/issues)
- **Twitter**: [@fabrknt](https://twitter.com/fabrknt)

---

## 📝 Contributing

Found an issue or want to improve these guides?

1. Fork the repository
2. Make your changes
3. Submit a pull request

All contributions are welcome!

---

**Last Updated**: December 31, 2025
**Based on**: Fragmetric on-chain analysis (Slot 390,261,895)
