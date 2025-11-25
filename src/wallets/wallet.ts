import {
  type Address,
  type Hex,
  type SignMessageParameters,
  type SignTypedDataParameters,
  type SwitchChainParameters,
  type TransactionRequest,
} from "viem";

import { Communicator } from "../communicator";
import { DEFAULT_CHAIN_ID, getDefaultRpcUrl, SUPPORTED_CHAIN_IDS } from "../constants";
import {
  GeminiStorage,
  type IStorage,
  STORAGE_CALL_BATCHES_KEY,
  STORAGE_ETH_ACCOUNTS_KEY,
  STORAGE_ETH_ACTIVE_CHAIN_KEY,
} from "../storage";
import {
  type Call,
  type CallBatchMetadata,
  type Capability,
  type Chain,
  type ConnectResponse,
  type GeminiProviderConfig,
  GeminiSdkEvent,
  type GeminiSdkMessage,
  type GeminiSdkMessageResponse,
  type GeminiSdkSendBatchCalls,
  type GeminiSdkSendTransaction,
  type GeminiSdkSignMessage,
  type GeminiSdkSignTypedData,
  GeminiSdkSwitchWalletVersionMessage,
  type GetCallsStatusResponse,
  type SendCallsParams,
  type SendCallsResponse,
  type SendTransactionResponse,
  type SignMessageResponse,
  type SignTypedDataResponse,
  type SwitchChainResponse,
  type WalletCapabilities,
  WalletVersion,
} from "../types";
import { hexStringFromNumber } from "../utils";

export function isChainSupportedByGeminiSw(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId as (typeof SUPPORTED_CHAIN_IDS)[number]);
}

const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
const HEX_DATA_REGEX = /^0x([0-9a-fA-F]{2})*$/;
const HEX_VALUE_REGEX = /^0x[0-9a-fA-F]+$/;
const MAX_IDENTIFIER_LENGTH = 8194;
const MAX_CALLS_PER_BATCH = 50;
const SUPPORTED_CAPABILITIES = new Set(["paymasterService"]);

export class GeminiWallet {
  private readonly communicator: Communicator;
  private readonly storage: IStorage;
  private initPromise: Promise<void>;
  public accounts: Address[] = [];
  public chain: Chain = { id: DEFAULT_CHAIN_ID };

  constructor({ appMetadata, chain, onDisconnectCallback, storage }: Readonly<GeminiProviderConfig>) {
    this.communicator = new Communicator({
      appMetadata,
      onDisconnectCallback,
    });
    // Use provided storage or create default GeminiStorage for web
    this.storage = storage || new GeminiStorage();

    // Initialize storage data - use provided chain config or fallback to default
    const fallbackChainId = chain?.id ?? DEFAULT_CHAIN_ID;
    const fallbackRpcUrl = chain?.rpcUrl ?? getDefaultRpcUrl(fallbackChainId);
    const defaultChain: Chain = {
      id: fallbackChainId,
      rpcUrl: fallbackRpcUrl,
    };
    this.initPromise = this.initializeFromStorage(defaultChain);
  }

  private async initializeFromStorage(defaultChain: Chain): Promise<void> {
    const fallbackChain: Chain = {
      ...defaultChain,
      rpcUrl: defaultChain.rpcUrl || getDefaultRpcUrl(defaultChain.id),
    };
    const [storedChain, storedAccounts] = await Promise.all([
      this.storage.loadObject<Chain>(STORAGE_ETH_ACTIVE_CHAIN_KEY, fallbackChain),
      this.storage.loadObject<Address[]>(STORAGE_ETH_ACCOUNTS_KEY, this.accounts),
    ]);

    // Ensure chain has rpcUrl fallback
    this.chain = {
      ...storedChain,
      rpcUrl: storedChain.rpcUrl || getDefaultRpcUrl(storedChain.id),
    };
    this.accounts = storedAccounts;
  }

  private async ensureInitialized(): Promise<void> {
    await this.initPromise;
  }

  private buildEip5792Error(code: number, message: string): Error & { code: number } {
    const error = new Error(message) as Error & { code: number };
    error.code = code;
    return error;
  }

  private assertParam(condition: boolean, message: string): void {
    if (!condition) {
      throw this.buildEip5792Error(-32602, message);
    }
  }

  private normalizeChainId(chainIdHex: Hex): { numeric: number; hex: Hex } {
    this.assertParam(typeof chainIdHex === "string", "chainId must be a hex string");
    this.assertParam(chainIdHex.startsWith("0x"), "chainId must include 0x prefix");
    const sanitized = chainIdHex.toLowerCase() as Hex;
    this.assertParam(sanitized === "0x0" || !/^0x0+[0-9a-f]/.test(sanitized), "chainId must not contain leading zeros");
    const numeric = Number.parseInt(sanitized, 16);
    this.assertParam(Number.isFinite(numeric), `Invalid chainId: ${chainIdHex}`);
    if (!isChainSupportedByGeminiSw(numeric)) {
      throw this.buildEip5792Error(5710, `Chain ${chainIdHex} is not supported by this wallet`);
    }
    return { hex: sanitized, numeric };
  }

  private normalizeIdentifier(providedId?: string): string {
    if (providedId !== undefined) {
      this.assertParam(typeof providedId === "string", "id must be a string when provided");
      this.assertParam(providedId.length > 0 && providedId.length <= MAX_IDENTIFIER_LENGTH, "id exceeds max length");
      return providedId;
    }

    if (window?.crypto?.getRandomValues) {
      const bytes = new Uint8Array(32);
      window.crypto.getRandomValues(bytes);
      return `0x${Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("")}`;
    }

    return `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  }

  private normalizeFromAddress(requestedFrom?: Address): Address {
    const activeAccount = this.accounts[0];
    if (!activeAccount) {
      throw this.buildEip5792Error(4100, "No connected account available");
    }

    if (!requestedFrom) {
      return activeAccount;
    }

    this.assertParam(ADDRESS_REGEX.test(requestedFrom), `Invalid from address: ${requestedFrom}`);
    const matchingAccount = this.accounts.find(acc => acc.toLowerCase() === requestedFrom.toLowerCase());
    if (!matchingAccount) {
      throw this.buildEip5792Error(4100, `Address ${requestedFrom} is not connected`);
    }
    return matchingAccount;
  }

  private normalizeCapabilityMap(
    capabilities: Record<string, Capability> | undefined,
    scope: string,
  ): Record<string, Capability> | undefined {
    if (!capabilities) return undefined;
    this.assertParam(
      typeof capabilities === "object" && !Array.isArray(capabilities),
      `${scope} capabilities must be an object`,
    );
    const normalized: Record<string, Capability> = {};
    for (const [name, definition] of Object.entries(capabilities)) {
      if (SUPPORTED_CAPABILITIES.has(name)) {
        normalized[name] = definition;
        continue;
      }
      if (definition?.optional) {
        continue;
      }
      throw this.buildEip5792Error(5700, `Capability '${name}' requested in ${scope} is not supported`);
    }
    return Object.keys(normalized).length ? normalized : undefined;
  }

  private validateCall(call: Call, index: number): void {
    this.assertParam(typeof call === "object" && call !== null, `Call #${index + 1} must be an object`);
    this.assertParam(
      typeof call.to === "string" && ADDRESS_REGEX.test(call.to),
      `Call #${index + 1} must include a valid 'to' address`,
    );
    if (call.data !== undefined) {
      this.assertParam(
        typeof call.data === "string" && HEX_DATA_REGEX.test(call.data),
        "Call data must be a valid hex",
      );
    }
    if (call.value !== undefined) {
      this.assertParam(typeof call.value === "string" && HEX_VALUE_REGEX.test(call.value), "Call value must be hex");
    }
    call.capabilities = this.normalizeCapabilityMap(call.capabilities, `call #${index + 1}`);
  }

  private getRpcUrlForChain(chainId: number): string {
    if (this.chain.id === chainId && this.chain.rpcUrl) {
      return this.chain.rpcUrl;
    }
    const fallback = getDefaultRpcUrl(chainId);
    if (!fallback) {
      throw this.buildEip5792Error(5710, `RPC URL missing for chain ${chainId}`);
    }
    return fallback;
  }

  async connect(): Promise<Address[]> {
    await this.ensureInitialized();
    const response = await this.sendMessageToPopup<GeminiSdkMessage, ConnectResponse>({
      chainId: this.chain.id,
      event: GeminiSdkEvent.SDK_CONNECT,
      origin: window.location.origin,
    });

    this.accounts = response.data.address ? [response.data.address] : [];
    await this.storage.storeObject(STORAGE_ETH_ACCOUNTS_KEY, this.accounts);

    return this.accounts;
  }

  async disconnect(): Promise<void> {
    await this.ensureInitialized();
    this.accounts = [];
    await this.storage.storeObject(STORAGE_ETH_ACCOUNTS_KEY, this.accounts);
  }

  async switchChain({ id }: SwitchChainParameters): Promise<string | null> {
    await this.ensureInitialized();
    // If chain is supported return response immediately
    if (isChainSupportedByGeminiSw(id)) {
      this.chain = {
        id,
        rpcUrl: getDefaultRpcUrl(id),
      };
      // Store new active chain with rpcUrl
      await this.storage.storeObject(STORAGE_ETH_ACTIVE_CHAIN_KEY, this.chain);
      // Per EIP-3326, must return null if chain switch was success
      return null;
    }

    // Message sdk to inform user of error
    const response = await this.sendMessageToPopup<GeminiSdkMessage, SwitchChainResponse>({
      chainId: this.chain.id,
      data: id,
      event: GeminiSdkEvent.SDK_SWITCH_CHAIN,
      origin: window.location.origin,
    });

    // Return error message
    return response.data.error ?? "Unsupported chain.";
  }

  async sendTransaction(txData: TransactionRequest): Promise<SendTransactionResponse["data"]> {
    await this.ensureInitialized();
    const response = await this.sendMessageToPopup<GeminiSdkSendTransaction, SendTransactionResponse>({
      chainId: this.chain.id,
      data: txData,
      event: GeminiSdkEvent.SDK_SEND_TRANSACTION,
      origin: window.location.origin,
    });

    return response.data;
  }

  async signData({ message }: SignMessageParameters): Promise<SignMessageResponse["data"]> {
    await this.ensureInitialized();
    const response = await this.sendMessageToPopup<GeminiSdkSignMessage, SignMessageResponse>({
      chainId: this.chain.id,
      data: { message },
      event: GeminiSdkEvent.SDK_SIGN_DATA,
      origin: window.location.origin,
    });

    return response.data;
  }

  async signTypedData({
    message,
    types,
    primaryType,
    domain,
  }: SignTypedDataParameters): Promise<SignTypedDataResponse["data"]> {
    await this.ensureInitialized();
    const response = await this.sendMessageToPopup<GeminiSdkSignTypedData, SignTypedDataResponse>({
      chainId: this.chain.id,
      data: {
        domain,
        message,
        primaryType,
        types,
      },
      event: GeminiSdkEvent.SDK_SIGN_TYPED_DATA,
      origin: window.location.origin,
    });
    return response.data;
  }

  async openSettings(): Promise<void> {
    await this.ensureInitialized();
    await this.sendMessageToPopup<GeminiSdkMessage, GeminiSdkMessageResponse>({
      chainId: this.chain.id,
      data: {},
      event: GeminiSdkEvent.SDK_OPEN_SETTINGS,
      origin: window.location.origin,
    });
  }

  async switchWalletVersion(version: WalletVersion): Promise<void> {
    await this.ensureInitialized();
    await this.sendMessageToPopup<GeminiSdkSwitchWalletVersionMessage, GeminiSdkMessageResponse>({
      chainId: this.chain.id,
      data: { version },
      event: GeminiSdkEvent.SDK_SWITCH_WALLET_VERSION,
      origin: window.location.origin,
    });
  }

  // EIP-5792 Wallet Call API Methods

  /**
   * Get wallet capabilities per EIP-5792
   * @param address - The wallet address to check capabilities for (must be connected)
   * @param requestedChainIds - Optional array of chain IDs in hex format (e.g., ["0x1", "0x89"])
   * @returns WalletCapabilities object keyed by chain ID
   * @throws Error with code -32602 for invalid chain ID format
   */
  getCapabilities(address: Address, requestedChainIds?: string[]): WalletCapabilities {
    const capabilities: WalletCapabilities = {};

    // Validate and parse requested chain IDs if provided
    let chainIdsToInclude: number[];
    if (requestedChainIds && requestedChainIds.length > 0) {
      chainIdsToInclude = [];
      for (const chainIdHex of requestedChainIds) {
        // Validate chain ID format per EIP-5792: must have 0x prefix and no leading zeros
        if (!chainIdHex.startsWith("0x")) {
          throw new Error(`Invalid chain ID format: ${chainIdHex}. Must start with '0x' prefix.`);
        }

        // Check for leading zeros (except "0x0")
        if (chainIdHex !== "0x0" && /^0x0+[0-9a-fA-F]/.test(chainIdHex)) {
          throw new Error(`Invalid chain ID format: ${chainIdHex}. Chain IDs must not have leading zeros.`);
        }

        const chainId = parseInt(chainIdHex, 16);
        if (isNaN(chainId)) {
          throw new Error(`Invalid chain ID: ${chainIdHex}. Must be a valid hexadecimal number.`);
        }

        // Only include supported chains (don't throw error for unsupported chains per spec)
        if (isChainSupportedByGeminiSw(chainId)) {
          chainIdsToInclude.push(chainId);
        }
      }
    } else {
      // Per EIP-5792: when no chain IDs requested, return all supported chains
      chainIdsToInclude = [...SUPPORTED_CHAIN_IDS];
    }

    // Per EIP-5792: Capabilities supported on ALL chains should be under "0x0"
    // and should NOT be repeated in individual chain objects
    capabilities["0x0"] = {
      atomic: {
        status: "supported", // Smart accounts support atomic batch execution on all chains
      },
      paymasterService: {
        supported: true, // Paymaster service is available on all supported chains
      },
    };

    // Add per-chain capabilities for requested/supported chains
    // Note: Since our capabilities are universal, we only need "0x0"
    // But we still include empty objects for requested chains to indicate support
    for (const chainId of chainIdsToInclude) {
      const chainIdHex = hexStringFromNumber(chainId);
      // Include chain in response to indicate it's supported
      // Don't repeat universal capabilities here per spec
      capabilities[chainIdHex] = {};
    }

    return capabilities;
  }

  async sendCalls(params: SendCallsParams): Promise<SendCallsResponse> {
    await this.ensureInitialized();

    this.assertParam(typeof params.version === "string" && params.version.length > 0, "version is required");
    this.assertParam(typeof params.atomicRequired === "boolean", "atomicRequired must be a boolean");
    this.assertParam(Array.isArray(params.calls), "calls must be an array");
    this.assertParam(params.calls.length > 0, "calls array cannot be empty");
    this.assertParam(
      params.calls.length <= MAX_CALLS_PER_BATCH,
      `call bundle exceeds maximum supported size (${MAX_CALLS_PER_BATCH})`,
    );

    const { numeric: requestedChainId, hex: normalizedChainId } = this.normalizeChainId(params.chainId);
    if (requestedChainId !== this.chain.id) {
      throw this.buildEip5792Error(
        5710,
        `Active chain (${this.chain.id}) does not match requested chain (${requestedChainId}). Please switch chains first.`,
      );
    }

    const fromAddress = this.normalizeFromAddress(params.from);

    const sanitizedRequestCapabilities = this.normalizeCapabilityMap(params.capabilities, "request");
    params.calls.forEach((call, idx) => this.validateCall(call, idx));

    const batches = await this.storage.loadObject<Record<string, CallBatchMetadata>>(STORAGE_CALL_BATCHES_KEY, {});
    const bundleId = this.normalizeIdentifier(params.id);
    if (batches[bundleId]) {
      throw this.buildEip5792Error(5720, `Bundle id ${bundleId} has already been submitted`);
    }

    const normalizedParams: SendCallsParams = {
      ...params,
      capabilities: sanitizedRequestCapabilities,
      chainId: normalizedChainId,
      from: fromAddress,
      id: bundleId,
    };

    const batchMetadata: CallBatchMetadata = {
      atomicExecuted: true,
      atomicRequired: normalizedParams.atomicRequired,
      calls: normalizedParams.calls,
      capabilities: normalizedParams.capabilities,
      chainId: normalizedParams.chainId,
      from: fromAddress,
      id: bundleId,
      rpcUrl: this.getRpcUrlForChain(requestedChainId),
      status: "pending",
      timestamp: Date.now(),
      version: normalizedParams.version,
    };

    batches[bundleId] = batchMetadata;
    await this.storage.storeObject(STORAGE_CALL_BATCHES_KEY, batches);

    try {
      const response = await this.sendMessageToPopup<GeminiSdkSendBatchCalls, SendTransactionResponse>({
        chainId: this.chain.id,
        data: normalizedParams,
        event: GeminiSdkEvent.SDK_SEND_BATCH_CALLS,
        origin: window.location.origin,
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      batchMetadata.transactionHash = response.data.hash as Hex;
      batches[bundleId] = batchMetadata;
      await this.storage.storeObject(STORAGE_CALL_BATCHES_KEY, batches);

      return {
        capabilities: {
          caip345: {
            caip2: `eip155:${requestedChainId}`,
            transactionHashes: response.data.hash ? [response.data.hash as Hex] : [],
          },
        },
        id: bundleId,
      };
    } catch (error) {
      batchMetadata.status = "failed";
      batches[bundleId] = batchMetadata;
      await this.storage.storeObject(STORAGE_CALL_BATCHES_KEY, batches);
      if (error && typeof error === "object" && "code" in (error as Record<string, unknown>)) {
        throw error;
      }
      throw this.buildEip5792Error(4001, (error as Error)?.message ?? "Batch submission was rejected");
    }
  }

  async getCallsStatus(batchId: string): Promise<GetCallsStatusResponse> {
    await this.ensureInitialized();

    this.assertParam(
      typeof batchId === "string" && batchId.length > 0 && batchId.length <= MAX_IDENTIFIER_LENGTH,
      "bundle id must be a string up to 4096 bytes",
    );

    const batches = await this.storage.loadObject<Record<string, CallBatchMetadata>>(STORAGE_CALL_BATCHES_KEY, {});
    const batch = batches[batchId];

    if (!batch) {
      throw this.buildEip5792Error(5730, `Unknown bundle ID: ${batchId}`);
    }

    const responseBase: Pick<GetCallsStatusResponse, "atomic" | "chainId" | "id" | "version"> = {
      atomic: batch.atomicExecuted,
      chainId: batch.chainId as Hex,
      id: batchId,
      version: batch.version,
    };

    const rpcUrl = batch.rpcUrl ?? this.getRpcUrlForChain(Number.parseInt(batch.chainId, 16));
    const allowedLogAddresses = new Set<string>();
    batch.calls.forEach(call => allowedLogAddresses.add(call.to.toLowerCase()));
    if (batch.from) {
      allowedLogAddresses.add(batch.from.toLowerCase());
    }
    const receipts: GetCallsStatusResponse["receipts"] = batch.receipts ? [...batch.receipts] : [];

    if (batch.transactionHash && rpcUrl) {
      try {
        const response = await fetch(rpcUrl, {
          body: JSON.stringify({
            id: 1,
            jsonrpc: "2.0",
            method: "eth_getTransactionReceipt",
            params: [batch.transactionHash],
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        });

        const json = await response.json();
        const receipt = json.result;

        if (receipt) {
          const statusHex = receipt.status === "0x1" ? ("0x1" as Hex) : ("0x0" as Hex);
          const filteredLogs = receipt.logs.filter((log: { address: string }) =>
            allowedLogAddresses.has(log.address.toLowerCase()),
          );
          batch.status = receipt.status === "0x1" ? "confirmed" : "reverted";
          batch.receipts = [
            {
              blockHash: receipt.blockHash,
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed,
              logs: filteredLogs.map((log: { address: string; data: string; topics: string[] }) => ({
                address: log.address,
                data: log.data,
                topics: log.topics,
              })),
              status: statusHex,
              transactionHash: receipt.transactionHash,
            },
          ];
          batches[batchId] = batch;
          await this.storage.storeObject(STORAGE_CALL_BATCHES_KEY, batches);
          receipts.splice(0, receipts.length, ...(batch.receipts ?? []));
        }
      } catch (error) {
        console.error("Failed to fetch transaction receipt:", error);
      }
    }

    let statusCode: 100 | 200 | 400 | 500 | 600;
    switch (batch.status) {
      case "pending":
        statusCode = 100;
        break;
      case "confirmed":
        statusCode = 200;
        break;
      case "failed":
        statusCode = 400;
        break;
      case "reverted":
        statusCode = 500;
        break;
      default:
        statusCode = 100;
    }

    return {
      ...responseBase,
      capabilities: batch.transactionHash
        ? {
            caip345: {
              caip2: `eip155:${Number.parseInt(batch.chainId, 16)}`,
              transactionHashes: batch.transactionHash ? [batch.transactionHash] : [],
            },
          }
        : undefined,
      receipts: receipts.length > 0 ? receipts : undefined,
      status: statusCode,
    };
  }

  async showCallsStatus(batchId: string): Promise<void> {
    await this.ensureInitialized();

    this.assertParam(
      typeof batchId === "string" && batchId.length > 0 && batchId.length <= MAX_IDENTIFIER_LENGTH,
      "bundle id must be a string up to 4096 bytes",
    );

    const batches = await this.storage.loadObject<Record<string, CallBatchMetadata>>(STORAGE_CALL_BATCHES_KEY, {});
    if (!batches[batchId]) {
      throw this.buildEip5792Error(5730, `Unknown bundle ID: ${batchId}`);
    }

    await this.sendMessageToPopup<GeminiSdkMessage, GeminiSdkMessageResponse>({
      chainId: this.chain.id,
      data: { bundleId: batchId },
      event: GeminiSdkEvent.SDK_SHOW_CALLS_STATUS,
      origin: window.location.origin,
    });
  }

  private sendMessageToPopup<M extends GeminiSdkMessage, R extends GeminiSdkMessageResponse>(
    request: GeminiSdkMessage,
  ): Promise<R> {
    return this.communicator.postRequestAndWaitForResponse<M, R>({
      ...request,
      requestId: window?.crypto?.randomUUID(),
    });
  }
}
