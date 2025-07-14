export { openPopup, closePopup } from "./popup";
export { 
  encodeBase64, 
  decodeBase64, 
  bufferToBase64URLString, 
  utf8StringToBuffer, 
  base64ToHex 
} from "./base64";
export { hexStringFromNumber, safeJsonStringify } from "./strings";

export const generateRequestId = (): string => {
  return crypto.randomUUID();
};