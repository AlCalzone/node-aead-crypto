declare interface EncryptionResult {
    ciphertext: Buffer,
    auth_tag: Buffer
}
declare interface DecryptionResult {
    plaintext: Buffer,
    auth_ok: boolean
}

declare namespace AeadCrypto {
    ccm: {
        encrypt: (
            key: Buffer, iv: Buffer, 
            plaintext: Buffer, 
            aad: Buffer, 
            authTagLength: number
        ) => EncryptionResult;
        decrypt: (
            key: Buffer, iv: Buffer, 
            ciphertext: Buffer, 
            aad: Buffer, 
            authTag: Buffer
        ) => DecryptionResult;
    };
    gcm: {
        encrypt: (
            key: Buffer, iv: Buffer, 
            plaintext: Buffer, 
            aad: Buffer
        ) => EncryptionResult;
        decrypt: (
            key: Buffer, iv: Buffer, 
            ciphertext: Buffer, 
            aad: Buffer, 
            authTag: Buffer
        ) => DecryptionResult;
    };
};

export = AeadCrypto;