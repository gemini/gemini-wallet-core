import { EventEmitter } from "eventemitter3";
import type { Address, Hex, SignMessageParameters, SignTypedDataParameters, TransactionRequest } from "viem";

import { type IStorage } from "./storage/storageInterface";

export enum GeminiSdkEvent {
  // Popup events
  POPUP_LOADED = "POPUP_LOADED",
  POPUP_UNLOADED = "POPUP_UNLOADED",
  POPUP_APP_CONTEXT = "POPUP_APP_CONTEXT",

  // SDK events
  SDK_CONNECT = "SDK_CONNECT",
  SDK_DISCONNECT = "SDK_DISCONNECT",
  SDK_SEND_TRANSACTION = "SDK_SEND_TRANSACTION",
  SDK_SIGN_DATA = "SDK_SIGN_DATA",
  SDK_SIGN_TYPED_DATA = "SDK_SIGN_TYPED_DATA",
  SDK_SWITCH_CHAIN = "SDK_SWITCH_CHAIN",
  SDK_SWITCH_WALLET_VERSION = "SDK_SWITCH_WALLET_VERSION",
  SDK_OPEN_SETTINGS = "SDK_OPEN_SETTINGS",
  SDK_CURRENT_ACCOUNT = "SDK_CURRENT_ACCOUNT",

  // EIP-5792 events
  SDK_SEND_BATCH_CALLS = "SDK_SEND_BATCH_CALLS",
  SDK_GET_CAPABILITIES = "SDK_GET_CAPABILITIES",
  SDK_GET_CALLS_STATUS = "SDK_GET_CALLS_STATUS",
  SDK_SHOW_CALLS_STATUS = "SDK_SHOW_CALLS_STATUS",
}

export interface AppMetadata {
  /**
   * The name of your application
   */
  name?: string;
  /**
   * The description of your application (optional)
   */
  description?: string;
  /**
   * URL of your application
   */
  url?: string;
  /**
   * URL to your application's icon or logo
   */
  icon?: string;
  /**
   * @deprecated Use `name` instead
   */
  appName?: string;
  /**
   * @deprecated Use `icon` instead
   */
  appLogoUrl?: string;
}

export interface AppContext {
  appMetadata: AppMetadata;
  origin: string;
  sdkVersion: string;
}

export interface Chain {
  id: number;
  rpcUrl?: string;
}

// Using const object with 'as const' assertion instead of enum
// This avoids TypeScript's isolatedModules re-export limitations
export const PlatformType = {
  REACT_NATIVE: "REACT_NATIVE",
  WEB: "WEB",
} as const;

export enum WalletVersion {
  V1 = "useV1Contract",
  V2 = "useV2Contract",
  V3 = "useV3Contract",
}

// Extract type from const object for type safety
export type PlatformType = (typeof PlatformType)[keyof typeof PlatformType];

export type GeminiProviderConfig = {
  appMetadata: AppMetadata;
  chain: Chain;
  platform?: PlatformType;
  onDisconnectCallback?: () => void;
  storage?: IStorage;
};

export interface RpcRequestArgs {
  readonly method: string;
  readonly params?: readonly unknown[] | object | Hex[];
}

export interface ProviderRpcError extends Error {
  code: number;
  data?: unknown;
  message: string;
}

export type ProviderEventMap = {
  accountsChanged: string[];
  chainChanged: string; // hex string
  connect: {
    readonly chainId: string;
  };
  disconnect: ProviderRpcError;
};

export type ProviderEventCallback = ProviderInterface["emit"];

export class ProviderEventEmitter extends EventEmitter<keyof ProviderEventMap> {}

export interface ProviderInterface extends ProviderEventEmitter {
  disconnect(): Promise<void>;
  emit<K extends keyof ProviderEventMap>(event: K, ...args: [ProviderEventMap[K]]): boolean;
  on<K extends keyof ProviderEventMap>(event: K, listener: (_: ProviderEventMap[K]) => void): this;
  request(args: RpcRequestArgs): Promise<any>;
}

export interface GeminiSdkMessage {
  chainId: number;
  data?: unknown;
  event: GeminiSdkEvent;
  origin: string;
  requestId?: string;
  wcData?: any;
}

export interface GeminiSdkMessageResponse {
  data?: unknown;
  event: GeminiSdkEvent;
  requestId?: string;
}

export interface PasskeyIdentifier {
  id: string;
  publicKey: `0x${string}`;
  type?: string;
}

export interface ConnectResponse extends Omit<GeminiSdkMessageResponse, "data"> {
  data: {
    address: Address;
    identifier?: PasskeyIdentifier;
  };
}

export interface SendTransactionResponse extends Omit<GeminiSdkMessageResponse, "data"> {
  data: { hash?: Hex; error?: string };
}

export interface SignMessageResponse extends Omit<GeminiSdkMessageResponse, "data"> {
  data: { hash?: Hex; error?: string };
}

export interface SignTypedDataResponse extends Omit<GeminiSdkMessageResponse, "data"> {
  data: { hash?: Hex; error?: string };
}

export interface SwitchChainResponse extends Omit<GeminiSdkMessageResponse, "data"> {
  data: { chainId?: number; error?: string };
}

export interface GeminiSdkSendTransaction extends Omit<GeminiSdkMessage, "data"> {
  data: TransactionRequest;
}

export interface GeminiSdkSignMessage extends Omit<GeminiSdkMessage, "data"> {
  data: SignMessageParameters;
}

export interface GeminiSdkSignTypedData extends Omit<GeminiSdkMessage, "data"> {
  data: SignTypedDataParameters;
}

export interface GeminiSdkSendBatchCalls extends Omit<GeminiSdkMessage, "data"> {
  data: SendCallsParams;
}

export interface GeminiSdkSwitchChain extends Omit<GeminiSdkMessage, "data"> {
  data: number;
}

export interface GeminiSdkAppContextMessage extends Omit<GeminiSdkMessage, "data"> {
  data: AppContext;
}

export interface GeminiSdkSwitchWalletVersionMessage extends Omit<GeminiSdkMessage, "data"> {
  data: WalletVersion;
}

export interface ReverseEnsResponse {
  address: Address;
  name: string | null;
}

// EIP-5792 Types

/**
 * EIP-5792 Capability definition used in wallet_sendCalls requests
 */
export interface Capability {
  optional?: boolean;
  [key: string]: unknown;
}

export interface Call {
  to: Address;
  value?: Hex;
  data?: Hex;
  chainId?: Hex;
  /** Per-call capabilities */
  capabilities?: Record<string, Capability>;
}

export interface SendCallsParams {
  version: string;
  id?: string;
  from?: Address;
  chainId: Hex;
  atomicRequired: boolean;
  calls: Call[];
  capabilities?: Record<string, Capability>;
}

/**
 * V3 upgrade status for wallet migration tracking
 * - COMPLETE: Migration to V3 completed
 * - NOT_SEEN: No V3 migration initiated
 * - IN_PROGRESS: Migration to V3 in progress
 */
export type V3UpgradeStatus = "COMPLETE" | "NOT_SEEN" | "IN_PROGRESS";

/**
 * Wallet status enum for migration tracking
 * - useV1Contract: Wallet should use V1 contract
 * - useV2Contract: Wallet should use V2 contract
 * - useV3Contract: Wallet should use V3 contract
 * - txsBlocked: Transactions are blocked for this wallet
 * - manualMigrationNeeded: Manual migration required
 * - isBeingAutoMigrated: Wallet is currently being auto-migrated
 * - migrationCheckFailed: Failed to get status
 */
export enum WalletStatus {
  useV1Contract = "useV1Contract",
  useV2Contract = "useV2Contract",
  useV3Contract = "useV3Contract",
  txsBlocked = "txsBlocked",
  manualMigrationNeeded = "manualMigrationNeeded",
  isBeingAutoMigrated = "isBeingAutoMigrated",
  migrationCheckFailed = "migrationCheckFailed",
}

export interface WalletCapabilities {
  [chainId: string]: {
    atomic?: {
      status: "supported" | "ready" | "unsupported";
    };
    paymasterService?: {
      supported: boolean;
    };
    credentialId?: string; // credentialId of passkey
    hasV2Wallet?: boolean; // indicator if wallet has legacy version
    wiseIdentifier?: string; // WISE ID for the wallet (present when wallet has been registered)
    v2UpgradeStatus?: WalletStatus; // v2 migration status
    v3UpgradeStatus?: V3UpgradeStatus; // v3 migration status
    v3Address?: Address; // wallet address for V3 contract
    legacyAddress?: Address; // wallet address for V1/V2 contracts
    [capability: string]: unknown; // future additional capabilities
  };
}

export interface CallBatchMetadata {
  id: string;
  chainId: string;
  rpcUrl?: string;
  from?: Address;
  calls: Call[];
  transactionHash?: Hex;
  status: "pending" | "confirmed" | "failed" | "reverted";
  timestamp: number;
  version: string;
  atomicRequired: boolean;
  atomicExecuted: boolean;
  capabilities?: Record<string, Capability>;
  receipts?: GetCallsStatusResponse["receipts"];
}

export interface GetCallsStatusResponse {
  version: string;
  id: string;
  chainId: Hex;
  status: 100 | 200 | 400 | 500 | 600;
  atomic: boolean;
  receipts?: Array<{
    logs: Array<{
      address: Address;
      data: Hex;
      topics: Hex[];
    }>;
    status: Hex; // 0x1 success, 0x0 failure
    blockHash: Hex;
    blockNumber: Hex;
    gasUsed: Hex;
    transactionHash: Hex;
  }>;
  capabilities?: Record<string, any>;
}

export interface SendCallsResponse {
  id: string;
  capabilities?: Record<string, any>;
}
