# node-aead-crypto
AEAD ciphers for Node.js and Electron

**Note: This module is not necessary on NodeJS 10+ because you can now provide the `authTagLength`.**

## Supported ciphers
* AES-CCM
* AES-GCM

## Usage
TODO

## Changelog
### 3.0.1 (2023-01-26)
Migrated the codebase to Rust and N-API. This module is now using [RustCrypto](https://github.com/RustCrypto) instead of OpenSSL due to a [bug](https://github.com/sfackler/rust-openssl/issues/1593) in the Rust OpenSSL bindings.
This change should make it possible to use the module on Electron again, which still does not support AEAD ciphers natively.

### 2.2.2 (2022-12-15)
* (AlCalzone) Disable preinstall script entirely to support Electron environments

### 2.2.1 (2021-06-19)
* (AlCalzone) Update dependencies

### 2.2.0 (2020-01-27)
* (AlCalzone) Replaced the node version comparison in `preinstall` with a check if all ciphers are natively available

### 2.1.1 (2018-11-27)
* (AlCalzone) Dropped `node-pre-gyp` for `prebuild`

### 2.0.0 (2018-11-04)
* (AlCalzone) Rework the installation procedure to fail on Node 10+

### 1.1.6 (2018-09-19)
* (AlCalzone) Update node-pre-gyp dependency

### 1.1.4 (2018-06-28)
* (AlCalzone) Update node-pre-gyp dependency

### 1.1.3 (2018-04-30)
* (AlCalzone) Update dependency versions hoping to fix an installation error

### 1.1.0
* (AlCalzone) Support NodeJS 10, drop Node 9 from precompilation

### 1.0.5
* (AlCalzone) Fixed installation issues on RPi 1

### 1.0.4
* (AlCalzone) Fixed installation issues on RPi 1

### 1.0.3
* (AlCalzone) Drop Node 7 from precompilation, add Node 9

### 1.0.2
* (AlCalzone) fixed typescript definitions

### 1.0.0
* (AlCalzone) initial release
