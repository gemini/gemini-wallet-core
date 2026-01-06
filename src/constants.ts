import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  sepolia,
} from "viem/chains";

/* eslint-disable no-undef */
// @ts-expect-error replaced at build time via tsup
export const SDK_BACKEND_URL = __SDK_BACKEND_URL__ as string;
// @ts-expect-error replaced at build time via tsup
export const HORIZON_API_URL = __HORIZON_API_URL__ as string;
// @ts-expect-error replaced at build time via tsup
export const SDK_VERSION = __SDK_VERSION__ as string;
/* eslint-enable no-undef */

export const ENS_API_URL = `${HORIZON_API_URL}/api/ens`;
export const DEFAULT_CHAIN_ID = 42161; // Arbitrum One

// Mainnet chain IDs
export const MAINNET_CHAIN_IDS = {
  ARBITRUM_ONE: 42161,
  BASE: 8453,
  ETHEREUM: 1,
  OP_MAINNET: 10,
  POLYGON: 137,
} as const;

// Testnet chain IDs
export const TESTNET_CHAIN_IDS = {
  ARBITRUM_SEPOLIA: 421614,
  BASE_SEPOLIA: 84532,
  OP_SEPOLIA: 11155420,
  POLYGON_AMOY: 80002,
  SEPOLIA: 11155111,
} as const;

// All supported chain IDs
export const SUPPORTED_CHAIN_IDS = [...Object.values(MAINNET_CHAIN_IDS), ...Object.values(TESTNET_CHAIN_IDS)];

// Helper function to get default RPC URL for a chain using viem chains
export function getDefaultRpcUrl(chainId: number): string | undefined {
  const chainMap: Record<number, string> = {
    [mainnet.id]: mainnet.rpcUrls.default.http[0],
    [arbitrum.id]: arbitrum.rpcUrls.default.http[0],
    [optimism.id]: optimism.rpcUrls.default.http[0],
    [base.id]: base.rpcUrls.default.http[0],
    [polygon.id]: polygon.rpcUrls.default.http[0],
    [sepolia.id]: sepolia.rpcUrls.default.http[0],
    [arbitrumSepolia.id]: arbitrumSepolia.rpcUrls.default.http[0],
    [optimismSepolia.id]: optimismSepolia.rpcUrls.default.http[0],
    [baseSepolia.id]: baseSepolia.rpcUrls.default.http[0],
    [polygonAmoy.id]: polygonAmoy.rpcUrls.default.http[0],
  };

  return chainMap[chainId];
}
