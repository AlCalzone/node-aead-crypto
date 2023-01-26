export { EncryptionResult, DecryptionResult } from "./index";
import { ccmDecrypt, ccmEncrypt, gcmDecrypt, gcmEncrypt } from "./index";

export declare const ccm: {
  encrypt: typeof ccmEncrypt;
  decrypt: typeof ccmDecrypt;
};

export declare const gcm: {
  encrypt: typeof gcmEncrypt;
  decrypt: typeof gcmDecrypt;
};
