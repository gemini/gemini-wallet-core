import type { Address, Hex } from "viem";

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
  SDK_OPEN_SETTINGS = "SDK_OPEN_SETTINGS",
}

export interface AppMetadata {
  appName?: string;
  appLogoUrl?: string;
  name?: string;
  description?: string;
  url?: string;
  icons?: string[];
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

export interface GeminiSdkMessage {
  event: GeminiSdkEvent;
  requestId: string;
  chainId: number;
  origin: string;
  data?: unknown;
  wcData?: any;
}

export interface GeminiSdkMessageResponse extends GeminiSdkMessage {
  error?: string;
  data?: unknown;
}

export interface ConnectResponse extends GeminiSdkMessageResponse {
  data: {
    address: Address;
    chainId: number;
  };
}

export interface SendTransactionResponse extends GeminiSdkMessageResponse {
  data?: { hash?: Hex; error?: string };
}

export interface SignMessageResponse extends GeminiSdkMessageResponse {
  data?: { hash?: Hex; error?: string };
}

export interface SignTypedDataResponse extends GeminiSdkMessageResponse {
  data?: { hash?: Hex; error?: string };
}

export interface SwitchChainResponse extends GeminiSdkMessageResponse {
  data?: { chainId?: number; error?: string };
}

export interface GeminiSdkSendTransaction extends GeminiSdkMessage {
  event: GeminiSdkEvent.SDK_SEND_TRANSACTION;
  data: {
    from: Address;
    to?: Address;
    value?: string;
    data?: Hex;
    gas?: string;
    gasPrice?: string;
  };
}

export interface GeminiSdkSignMessage extends GeminiSdkMessage {
  event: GeminiSdkEvent.SDK_SIGN_DATA;
  data: {
    account: Address;
    message: string;
  };
}

export interface GeminiSdkSignTypedData extends GeminiSdkMessage {
  event: GeminiSdkEvent.SDK_SIGN_TYPED_DATA;
  data: {
    account: Address;
    domain: any;
    types: any;
    primaryType: string;
    message: any;
  };
}

export interface GeminiSdkSwitchChain extends GeminiSdkMessage {
  event: GeminiSdkEvent.SDK_SWITCH_CHAIN;
  data: {
    id: number;
  };
}

export interface GeminiSdkConnectMessage extends GeminiSdkMessage {
  event: GeminiSdkEvent.SDK_CONNECT;
}

export interface GeminiSdkDisconnectMessage extends GeminiSdkMessage {
  event: GeminiSdkEvent.SDK_DISCONNECT;
}

export interface GeminiSdkAppContextMessage extends GeminiSdkMessage {
  event: GeminiSdkEvent.POPUP_APP_CONTEXT;
  data: AppContext;
}