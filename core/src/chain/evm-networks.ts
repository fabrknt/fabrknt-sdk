/**
 * EVM Network Configuration
 *
 * Network configurations for supported EVM-compatible chains including
 * Ethereum, Base, Arbitrum, and Polygon. Includes mainnet and testnet
 * configurations with default RPC endpoints.
 */

import type { ChainId } from "./types";

/**
 * EVM network configuration interface
 */
export interface EVMNetworkConfig {
    /** Blockchain name */
    name: string;
    /** EVM chain ID */
    chainId: number;
    /** Native currency symbol */
    nativeCurrency: string;
    /** Native currency decimals */
    decimals: number;
    /** RPC endpoint URLs (primary and fallbacks) */
    rpcUrls: string[];
    /** Block explorer URL */
    blockExplorer?: string;
    /** Default max priority fee per gas (in wei) for EIP-1559 */
    defaultMaxPriorityFeePerGas?: bigint;
    /** Gas estimation multiplier (e.g., 1.2 = 20% buffer) */
    gasMultiplier: number;
    /** Whether this is a testnet */
    isTestnet: boolean;
}

/**
 * Network configurations by chain ID
 */
const NETWORK_CONFIGS: Record<string, Record<string, EVMNetworkConfig>> = {
    ethereum: {
        mainnet: {
            name: "Ethereum Mainnet",
            chainId: 1,
            nativeCurrency: "ETH",
            decimals: 18,
            rpcUrls: [
                "https://eth.llamarpc.com",
                "https://rpc.ankr.com/eth",
                "https://ethereum.publicnode.com",
            ],
            blockExplorer: "https://etherscan.io",
            defaultMaxPriorityFeePerGas: 2_000_000_000n, // 2 gwei
            gasMultiplier: 1.2, // 20% buffer for mainnet
            isTestnet: false,
        },
        sepolia: {
            name: "Ethereum Sepolia Testnet",
            chainId: 11155111,
            nativeCurrency: "ETH",
            decimals: 18,
            rpcUrls: [
                "https://rpc.sepolia.org",
                "https://ethereum-sepolia.publicnode.com",
                "https://rpc2.sepolia.org",
            ],
            blockExplorer: "https://sepolia.etherscan.io",
            defaultMaxPriorityFeePerGas: 1_000_000_000n, // 1 gwei
            gasMultiplier: 1.15,
            isTestnet: true,
        },
    },
    base: {
        "base-mainnet": {
            name: "Base Mainnet",
            chainId: 8453,
            nativeCurrency: "ETH",
            decimals: 18,
            rpcUrls: [
                "https://mainnet.base.org",
                "https://base.llamarpc.com",
                "https://base.publicnode.com",
            ],
            blockExplorer: "https://basescan.org",
            defaultMaxPriorityFeePerGas: 100_000n, // 0.0001 gwei (L2s have lower fees)
            gasMultiplier: 1.1, // 10% buffer for L2
            isTestnet: false,
        },
        "base-sepolia": {
            name: "Base Sepolia Testnet",
            chainId: 84532,
            nativeCurrency: "ETH",
            decimals: 18,
            rpcUrls: [
                "https://sepolia.base.org",
                "https://base-sepolia.publicnode.com",
            ],
            blockExplorer: "https://sepolia.basescan.org",
            defaultMaxPriorityFeePerGas: 100_000n,
            gasMultiplier: 1.1,
            isTestnet: true,
        },
    },
    arbitrum: {
        "arbitrum-one": {
            name: "Arbitrum One",
            chainId: 42161,
            nativeCurrency: "ETH",
            decimals: 18,
            rpcUrls: [
                "https://arb1.arbitrum.io/rpc",
                "https://arbitrum.llamarpc.com",
                "https://arbitrum-one.publicnode.com",
            ],
            blockExplorer: "https://arbiscan.io",
            defaultMaxPriorityFeePerGas: 100_000n,
            gasMultiplier: 1.15, // Slightly higher for L1 data costs
            isTestnet: false,
        },
        "arbitrum-sepolia": {
            name: "Arbitrum Sepolia Testnet",
            chainId: 421614,
            nativeCurrency: "ETH",
            decimals: 18,
            rpcUrls: [
                "https://sepolia-rollup.arbitrum.io/rpc",
                "https://arbitrum-sepolia.publicnode.com",
            ],
            blockExplorer: "https://sepolia.arbiscan.io",
            defaultMaxPriorityFeePerGas: 100_000n,
            gasMultiplier: 1.15,
            isTestnet: true,
        },
    },
    polygon: {
        "polygon-mainnet": {
            name: "Polygon Mainnet",
            chainId: 137,
            nativeCurrency: "MATIC",
            decimals: 18,
            rpcUrls: [
                "https://polygon-rpc.com",
                "https://polygon.llamarpc.com",
                "https://polygon-bor.publicnode.com",
            ],
            blockExplorer: "https://polygonscan.com",
            defaultMaxPriorityFeePerGas: 30_000_000_000n, // 30 gwei (Polygon has higher base)
            gasMultiplier: 1.25, // Higher buffer due to volatility
            isTestnet: false,
        },
        "polygon-amoy": {
            name: "Polygon Amoy Testnet",
            chainId: 80002,
            nativeCurrency: "MATIC",
            decimals: 18,
            rpcUrls: [
                "https://rpc-amoy.polygon.technology",
                "https://polygon-amoy.publicnode.com",
            ],
            blockExplorer: "https://amoy.polygonscan.com",
            defaultMaxPriorityFeePerGas: 30_000_000_000n,
            gasMultiplier: 1.2,
            isTestnet: true,
        },
    },
};

/**
 * Get default EVM network configuration
 *
 * @param chain - Chain identifier (ethereum, base, arbitrum, polygon)
 * @param network - Network identifier (mainnet, testnet name, etc.)
 * @returns Network configuration
 * @throws Error if chain or network not found
 */
export function getDefaultEVMNetworkConfig(
    chain: ChainId,
    network: string
): EVMNetworkConfig {
    const chainConfigs = NETWORK_CONFIGS[chain];
    if (!chainConfigs) {
        throw new Error(
            `No network configuration found for chain: ${chain}. Supported chains: ethereum, base, arbitrum, polygon`
        );
    }

    const networkConfig = chainConfigs[network];
    if (!networkConfig) {
        const availableNetworks = Object.keys(chainConfigs).join(", ");
        throw new Error(
            `No configuration found for network "${network}" on chain "${chain}". Available networks: ${availableNetworks}`
        );
    }

    return networkConfig;
}

/**
 * Get chain ID from Fabrknt chain identifier
 *
 * @param chain - Chain identifier
 * @param network - Network identifier
 * @returns EVM chain ID
 */
export function getChainIdFromChain(chain: ChainId, network: string): number {
    const config = getDefaultEVMNetworkConfig(chain, network);
    return config.chainId;
}

/**
 * Check if a chain ID supports EIP-1559 transactions
 *
 * All modern EVM chains support EIP-1559, but this provides a hook
 * for future compatibility checks if needed.
 *
 * @param chainId - EVM chain ID
 * @returns True if EIP-1559 is supported
 */
export function isEIP1559Compatible(chainId: number): boolean {
    // All our supported networks use EIP-1559
    const supportedChainIds = [
        1, // Ethereum Mainnet
        11155111, // Sepolia
        8453, // Base Mainnet
        84532, // Base Sepolia
        42161, // Arbitrum One
        421614, // Arbitrum Sepolia
        137, // Polygon Mainnet
        80002, // Polygon Amoy
    ];

    return supportedChainIds.includes(chainId);
}

/**
 * Get all supported EVM chains
 *
 * @returns Array of supported chain identifiers
 */
export function getSupportedEVMChains(): ChainId[] {
    return ["ethereum", "base", "arbitrum", "polygon"];
}

/**
 * Get all networks for a specific chain
 *
 * @param chain - Chain identifier
 * @returns Array of network identifiers for the chain
 */
export function getNetworksForChain(chain: ChainId): string[] {
    const chainConfigs = NETWORK_CONFIGS[chain];
    if (!chainConfigs) {
        return [];
    }
    return Object.keys(chainConfigs);
}

/**
 * Check if a chain is an EVM chain
 *
 * @param chain - Chain identifier to check
 * @returns True if the chain is EVM-compatible
 */
export function isEVMChain(chain: ChainId): boolean {
    return getSupportedEVMChains().includes(chain);
}
