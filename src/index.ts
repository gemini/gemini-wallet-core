// Main exports
export { Communicator } from "./communicator";

// Type exports
export type {
  AppMetadata,
  AppContext,
  Chain,
  GeminiSdkMessage,
  GeminiSdkMessageResponse,
  ConnectResponse,
  SendTransactionResponse,
  SignMessageResponse,
  SignTypedDataResponse,
  SwitchChainResponse,
  GeminiSdkSendTransaction,
  GeminiSdkSignMessage,
  GeminiSdkSignTypedData,
  GeminiSdkSwitchChain,
  GeminiSdkAppContextMessage,
} from "./types";

export { GeminiSdkEvent } from "./types";

// Utility exports
export { 
  openPopup, 
  closePopup,
  generateRequestId,
  hexStringFromNumber,
  encodeBase64,
  decodeBase64,
  bufferToBase64URLString,
  utf8StringToBuffer,
  base64ToHex,
  safeJsonStringify
} from "./utils";

// Constants
export { 
  SDK_BACKEND_URL, 
  SDK_VERSION,
  DEFAULT_CHAIN_ID,
  POPUP_WIDTH,
  POPUP_HEIGHT
} from "./constants";