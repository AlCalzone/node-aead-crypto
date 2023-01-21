#![deny(clippy::all)]

#[macro_use]
extern crate napi_derive;

use paste::paste;

use napi::{bindgen_prelude::*, Error};

pub type Result<T> = std::result::Result<T, Error>;

use aes::{Aes128, Aes192, Aes256};
use aes_gcm::AesGcm;
use ccm::{
  aead::{generic_array::GenericArray, Aead, KeyInit, Payload},
  consts::{U10, U11, U12, U13, U14, U16, U4, U6, U7, U8, U9},
  Ccm,
};

#[napi(object)]
pub struct EncryptionResult {
  #[napi]
  pub ciphertext: Buffer,
  #[napi(js_name = "auth_tag")]
  pub auth_tag: Buffer,
}

#[napi(object)]
pub struct DecryptionResult {
  #[napi]
  pub plaintext: Buffer,
  #[napi(js_name = "auth_ok")]
  pub auth_ok: bool,
}

fn encrypt_worker(
  cipher: impl Aead,
  iv: Buffer,
  plaintext: Buffer,
  aad: Buffer,
  auth_tag_len: u8,
) -> Result<EncryptionResult> {
  let payload = Payload {
    msg: plaintext.as_ref(),
    aad: aad.as_ref(),
  };

  let ciphertext_with_tag = cipher
    .encrypt(GenericArray::from_slice(iv.as_ref()), payload)
    .unwrap();

  let (ciphertext, auth_tag) =
    ciphertext_with_tag.split_at(ciphertext_with_tag.len() - auth_tag_len as usize);

  return Ok(EncryptionResult {
    ciphertext: ciphertext.into(),
    auth_tag: auth_tag.into(),
  });
}

fn decrypt_worker(
  cipher: impl Aead,
  iv: Buffer,
  ciphertext: Buffer,
  aad: Buffer,
  auth_tag: Buffer,
) -> Result<DecryptionResult> {
  let payload = Payload {
    msg: &[ciphertext.as_ref(), auth_tag.as_ref()].concat(),
    aad: aad.as_ref(),
  };

  match cipher.decrypt(GenericArray::from_slice(iv.as_ref()), payload) {
    Ok(plaintext) => Ok(DecryptionResult {
      plaintext: plaintext.into(),
      auth_ok: true,
    }),
    Err(_) => Ok(DecryptionResult {
      plaintext: vec![].into(),
      auth_ok: false,
    }),
  }
}

macro_rules! gcm_impls {
  ($($key_len_8: expr),+) => {
    #[napi]
    pub fn gcm_encrypt(
      key: Buffer,
      iv: Buffer,
      plaintext: Buffer,
      aad: Buffer,
    ) -> Result<EncryptionResult> {
      if (iv.len() != 12) {
        return Err(napi::Error::from_reason(format!("Invalid IV size, must be 12, got {}", iv.len())));
      }
      match key.len() * 8 {
        $($key_len_8 => {
          return encrypt_worker(
            paste!{ AesGcm::<[<Aes $key_len_8>], U12>::new(GenericArray::from_slice(key.as_ref())) },
            iv,
            plaintext,
            aad,
            16,
          );
        },)+
        _ => Err(napi::Error::from_reason("Invalid key size")),
      }
    }

    #[napi]
    pub fn gcm_decrypt(
      key: Buffer,
      iv: Buffer,
      ciphertext: Buffer,
      aad: Buffer,
      auth_tag: Buffer,
    ) -> Result<DecryptionResult> {
      if (iv.len() != 12) {
        return Err(napi::Error::from_reason(format!("Invalid IV size, must be 12, got {}", iv.len())));
      }
      match key.len() * 8 {
        $($key_len_8 => {
          return decrypt_worker(
            paste!{ AesGcm::<[<Aes $key_len_8>], U12>::new(GenericArray::from_slice(key.as_ref())) },
            iv,
            ciphertext,
            aad,
            auth_tag,
          );
        },)+
        _ => Err(napi::Error::from_reason("Invalid key size")),
      }
    }
  };
}

gcm_impls!(128, 192, 256);

macro_rules! ccm_impls {
  ($(($key_len_8: expr, $auth_tag_len: expr, $iv_len: expr)),+) => {
    #[napi]
    pub fn ccm_encrypt(
      key: Buffer,
      iv: Buffer,
      plaintext: Buffer,
      aad: Buffer,
      auth_tag_len: u8,
    ) -> Result<EncryptionResult> {
      match (key.len() * 8, auth_tag_len, iv.len()) {
        $(($key_len_8, $auth_tag_len, $iv_len) => {
          return encrypt_worker(
            paste!{ Ccm::<[<Aes $key_len_8>], [<U $auth_tag_len>], [<U $iv_len>]>::new(GenericArray::from_slice(key.as_ref())) },
            iv,
            plaintext,
            aad,
            auth_tag_len,
          );
        },)+
        _ => Err(napi::Error::from_reason("Invalid combination of key size, IV size and auth tag length")),
      }
    }

    #[napi]
    pub fn ccm_decrypt(
      key: Buffer,
      iv: Buffer,
      ciphertext: Buffer,
      aad: Buffer,
      auth_tag: Buffer,
    ) -> Result<DecryptionResult> {
      match (key.len() * 8, auth_tag.len(), iv.len()) {
        $(($key_len_8, $auth_tag_len, $iv_len) => {
          return decrypt_worker(
            paste!{ Ccm::<[<Aes $key_len_8>], [<U $auth_tag_len>], [<U $iv_len>]>::new(GenericArray::from_slice(key.as_ref())) },
            iv,
            ciphertext,
            aad,
            auth_tag,
          );
        },)+
        _ => Err(napi::Error::from_reason("Invalid combination of key size, IV size and auth tag length")),
      }
    }
  };
}

ccm_impls!(
  (128, 4, 7),
  (128, 4, 8),
  (128, 4, 9),
  (128, 4, 10),
  (128, 4, 11),
  (128, 4, 12),
  (128, 4, 13),
  (128, 6, 7),
  (128, 6, 8),
  (128, 6, 9),
  (128, 6, 10),
  (128, 6, 11),
  (128, 6, 12),
  (128, 6, 13),
  (128, 8, 7),
  (128, 8, 8),
  (128, 8, 9),
  (128, 8, 10),
  (128, 8, 11),
  (128, 8, 12),
  (128, 8, 13),
  (128, 10, 7),
  (128, 10, 8),
  (128, 10, 9),
  (128, 10, 10),
  (128, 10, 11),
  (128, 10, 12),
  (128, 10, 13),
  (128, 12, 7),
  (128, 12, 8),
  (128, 12, 9),
  (128, 12, 10),
  (128, 12, 11),
  (128, 12, 12),
  (128, 12, 13),
  (128, 14, 7),
  (128, 14, 8),
  (128, 14, 9),
  (128, 14, 10),
  (128, 14, 11),
  (128, 14, 12),
  (128, 14, 13),
  (128, 16, 7),
  (128, 16, 8),
  (128, 16, 9),
  (128, 16, 10),
  (128, 16, 11),
  (128, 16, 12),
  (128, 16, 13),
  (192, 4, 7),
  (192, 4, 8),
  (192, 4, 9),
  (192, 4, 10),
  (192, 4, 11),
  (192, 4, 12),
  (192, 4, 13),
  (192, 6, 7),
  (192, 6, 8),
  (192, 6, 9),
  (192, 6, 10),
  (192, 6, 11),
  (192, 6, 12),
  (192, 6, 13),
  (192, 8, 7),
  (192, 8, 8),
  (192, 8, 9),
  (192, 8, 10),
  (192, 8, 11),
  (192, 8, 12),
  (192, 8, 13),
  (192, 10, 7),
  (192, 10, 8),
  (192, 10, 9),
  (192, 10, 10),
  (192, 10, 11),
  (192, 10, 12),
  (192, 10, 13),
  (192, 12, 7),
  (192, 12, 8),
  (192, 12, 9),
  (192, 12, 10),
  (192, 12, 11),
  (192, 12, 12),
  (192, 12, 13),
  (192, 14, 7),
  (192, 14, 8),
  (192, 14, 9),
  (192, 14, 10),
  (192, 14, 11),
  (192, 14, 12),
  (192, 14, 13),
  (192, 16, 7),
  (192, 16, 8),
  (192, 16, 9),
  (192, 16, 10),
  (192, 16, 11),
  (192, 16, 12),
  (192, 16, 13),
  (256, 4, 7),
  (256, 4, 8),
  (256, 4, 9),
  (256, 4, 10),
  (256, 4, 11),
  (256, 4, 12),
  (256, 4, 13),
  (256, 6, 7),
  (256, 6, 8),
  (256, 6, 9),
  (256, 6, 10),
  (256, 6, 11),
  (256, 6, 12),
  (256, 6, 13),
  (256, 8, 7),
  (256, 8, 8),
  (256, 8, 9),
  (256, 8, 10),
  (256, 8, 11),
  (256, 8, 12),
  (256, 8, 13),
  (256, 10, 7),
  (256, 10, 8),
  (256, 10, 9),
  (256, 10, 10),
  (256, 10, 11),
  (256, 10, 12),
  (256, 10, 13),
  (256, 12, 7),
  (256, 12, 8),
  (256, 12, 9),
  (256, 12, 10),
  (256, 12, 11),
  (256, 12, 12),
  (256, 12, 13),
  (256, 14, 7),
  (256, 14, 8),
  (256, 14, 9),
  (256, 14, 10),
  (256, 14, 11),
  (256, 14, 12),
  (256, 14, 13),
  (256, 16, 7),
  (256, 16, 8),
  (256, 16, 9),
  (256, 16, 10),
  (256, 16, 11),
  (256, 16, 12),
  (256, 16, 13)
);
