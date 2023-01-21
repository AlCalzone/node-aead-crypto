import {
	DecryptionResult,
	EncryptionResult,
	ccmDecrypt,
	ccmEncrypt,
	gcmDecrypt,
	gcmEncrypt
} from "./index.js";

export const ccm = {
	encrypt: ccmEncrypt,
	decrypt: ccmDecrypt
};

export const gcm = {
	encrypt: gcmEncrypt,
	decrypt: gcmDecrypt
};