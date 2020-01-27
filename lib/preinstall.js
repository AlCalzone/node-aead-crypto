"use strict";
const crypto = require("crypto");

// Test if this package is necessary

// Performs an encryption
function encrypt(mode, key, iv, plaintext, additionalData, authTagLength) {
  // prepare encryption
  const algorithm = `aes-${key.length * 8}-${mode}`;
  // @ts-ignore
  const cipher = crypto.createCipheriv(algorithm, key, iv, { authTagLength });
  cipher.setAAD(additionalData, { plaintextLength: plaintext.length });

  // do encryption
  const ciphertext = cipher.update(plaintext);
  cipher.final();
  const auth_tag = cipher.getAuthTag();

  return { ciphertext, auth_tag };
}

// The params to be used for the polyfilled ciphers
const cipherParams = {
  "aes-128-ccm": {
    interface: "ccm",
    keyLength: 16,
    ivLength: 8,
    authTagLength: 16
  },
  "aes-128-ccm8": {
    interface: "ccm",
    keyLength: 16,
    ivLength: 8,
    authTagLength: 8
  },
  "aes-256-ccm": {
    interface: "ccm",
    keyLength: 32,
    ivLength: 8,
    authTagLength: 16
  },
  "aes-256-ccm8": {
    interface: "ccm",
    keyLength: 32,
    ivLength: 8,
    authTagLength: 8
  },
  "aes-128-gcm": {
    interface: "gcm",
    keyLength: 16,
    ivLength: 8,
    authTagLength: 16
  },
  "aes-256-gcm": {
    interface: "gcm",
    keyLength: 32,
    ivLength: 8,
    authTagLength: 16
  }
};

// The expected encryption outcomes when encrypted like below
const expected = {
  "aes-128-ccm": {
    ciphertext: Buffer.from("f9c9d526a89b907337320c38f4acbb8e", "hex"),
    auth_tag: Buffer.from("c04fdc1e62281a4a421e045c6a58d587", "hex")
  },
  "aes-128-ccm8": {
    ciphertext: Buffer.from("f9c9d526a89b907337320c38f4acbb8e", "hex"),
    auth_tag: Buffer.from("b174fe3e6f64d20c", "hex")
  },
  "aes-256-ccm": {
    ciphertext: Buffer.from("cd49619bf42a8f103efd870ef71d8abe", "hex"),
    auth_tag: Buffer.from("aa54f83fbfc2d0b4d06ed78746bda8a3", "hex")
  },
  "aes-256-ccm8": {
    ciphertext: Buffer.from("cd49619bf42a8f103efd870ef71d8abe", "hex"),
    auth_tag: Buffer.from("14f99d061e9d7269", "hex")
  },
  "aes-128-gcm": {
    ciphertext: Buffer.from("4414be4c5150598cfbe81443f009375e", "hex"),
    auth_tag: Buffer.from("6052b1526daa9d38ff232aac84d731c8", "hex")
  },
  "aes-256-gcm": {
    ciphertext: Buffer.from("e06ab780e5e299f5c2f8612393f3015e", "hex"),
    auth_tag: Buffer.from("b3717df326df397b3130ee71ed5f1339", "hex")
  }
};

// Test all algorithms. If there is an error, we need this lib
let hasError = false;
for (const algorithm of Object.keys(cipherParams)) {
  const params = cipherParams[algorithm];
  const key = Buffer.alloc(params.keyLength, 0);
  const iv = Buffer.alloc(params.ivLength, 1);
  const plaintext = Buffer.from("abcdefghijklmnop", "utf8");
  const additionalData = Buffer.alloc(8, 2);
  let result;
  try {
    result = encrypt(
      params.interface,
      key,
      iv,
      plaintext,
      additionalData,
      params.authTagLength
    );
  } catch (e) {
    hasError = true;
    break;
  }

  if (
    result.auth_tag.compare(expected[algorithm].auth_tag) !== 0 ||
    result.ciphertext.compare(expected[algorithm].ciphertext) !== 0
  ) {
    hasError = true;
    break;
  }
}

if (!hasError) {
  console.error(
    "node-aead-crypto not needed on this system, since all ciphers are natively supported"
  );
  process.exit(1);
}
process.exit(0);
