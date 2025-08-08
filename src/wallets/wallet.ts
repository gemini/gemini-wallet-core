import {
  type Address,
  type SignMessageParameters,
  SignTypedDataParameters,
  type SwitchChainParameters,
  type TransactionRequest,
} from "viem";

import { Communicator } from "@/communicator";
import { GeminiStorage, STORAGE_ETH_ACCOUNTS_KEY, STORAGE_ETH_ACTIVE_CHAIN_KEY, type IStorage } from "@/storage";
import {
  type Chain,
  type ConnectResponse,
  type GeminiProviderConfig,
  GeminiSdkEvent,
  type GeminiSdkMessage,
  GeminiSdkMessageResponse,
  type GeminiSdkSendTransaction,
  type GeminiSdkSignMessage,
  GeminiSdkSignTypedData,
  SendTransactionResponse,
  type SignMessageResponse,
  SignTypedDataResponse,
  type SwitchChainResponse,
} from "@/types";
import { DEFAULT_CHAIN_ID, SUPPORTED_CHAIN_IDS } from "@/constants";

export function isChainSupportedByGeminiSw(chainId: number): boolean {
  return SUPPORTED_CHAIN_IDS.includes(chainId as typeof SUPPORTED_CHAIN_IDS[number]);
}

export class GeminiWallet {
  private readonly communicator: Communicator;
  private storage: IStorage;
  public accounts: Address[] = [];
  public chain: Chain = { id: DEFAULT_CHAIN_ID };

  constructor({
    appMetadata,
    chain,
    onDisconnectCallback,
    storage,
  }: Readonly<GeminiProviderConfig & { storage?: IStorage }>) {
    this.communicator = new Communicator({
      appMetadata,
      onDisconnectCallback,
    });
    // Use provided storage or create default GeminiStorage for web
    this.storage = storage || new GeminiStorage();
    this.storage
      .loadObject<Chain>(STORAGE_ETH_ACTIVE_CHAIN_KEY, { id: chain?.id ?? this.chain.id })
      .then((chain: Chain) => {
        this.chain = chain;
      });
    this.storage.loadObject<Address[]>(STORAGE_ETH_ACCOUNTS_KEY, this.accounts).then((accounts: Address[]) => {
      this.accounts = accounts;
    });
  }

  async connect(): Promise<Address[]> {
    const response = await this.sendMessageToPopup<GeminiSdkMessage, ConnectResponse>({
      chainId: this.chain.id,
      event: GeminiSdkEvent.SDK_CONNECT,
      origin: window.location.origin,
    });

    this.accounts = [response.data.address];
    await this.storage.storeObject(STORAGE_ETH_ACCOUNTS_KEY, this.accounts);

    return this.accounts;
  }

  async switchChain({ id }: SwitchChainParameters): Promise<string | null> {
    // if chain is supported return response immediately
    if (isChainSupportedByGeminiSw(id)) {
      this.chain = { id };
      // store new active chain
      await this.storage.storeObject(STORAGE_ETH_ACTIVE_CHAIN_KEY, { id });
      // per EIP-3326, must return null if chain switch was success
      return null;
    }
    // message sdk to inform user of error
    const response = await this.sendMessageToPopup<GeminiSdkMessage, SwitchChainResponse>({
      chainId: this.chain.id,
      data: id,
      event: GeminiSdkEvent.SDK_SWITCH_CHAIN,
      origin: window.location.origin,
    });

    // return error message
    return response.data.error as string;
  }

  async sendTransaction(txData: TransactionRequest): Promise<SendTransactionResponse["data"]> {
    const response = await this.sendMessageToPopup<GeminiSdkSendTransaction, SendTransactionResponse>({
      chainId: this.chain.id,
      data: txData,
      event: GeminiSdkEvent.SDK_SEND_TRANSACTION,
      origin: window.location.origin,
    });

    return response.data;
  }

  async signData({ message }: SignMessageParameters): Promise<SignMessageResponse["data"]> {
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
    await this.sendMessageToPopup<GeminiSdkMessage, GeminiSdkMessageResponse>({
      chainId: this.chain.id,
      data: {},
      event: GeminiSdkEvent.SDK_OPEN_SETTINGS,
      origin: window.location.origin,
    });
  }

  private async sendMessageToPopup<M extends GeminiSdkMessage, R extends GeminiSdkMessageResponse>(
    request: GeminiSdkMessage,
  ): Promise<R> {
    return await this.communicator.postRequestAndWaitForResponse<M, R>({
      ...request,
      requestId: window?.crypto?.randomUUID(),
    });
  }
}
