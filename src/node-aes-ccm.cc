#include <node.h>
#include <nan.h>
#include <node_buffer.h> // TODO: why do we need this?
#include <openssl/evp.h>

// see https://wiki.openssl.org/index.php/EVP_Authenticated_Encryption_and_Decryption
// for details on the implementation

using namespace v8;
using namespace node;
	
// Perform GCM mode AES-128 encryption using the provided key, IV, plaintext
// and auth_data buffers, and return an object containing "ciphertext"
// and "auth_tag" buffers.

NAN_METHOD(ccm::Encrypt) {
	Nan::HandleScope scope;
	const EVP_CIPHER *cipher_type = NULL;
	size_t key_len = 0;
	
	// The key needs to be 16, 24 or 32 bytes and determines the encryption
	// bit level used
	if (info.Length() >= 1 && Buffer::HasInstance(info[0])) {
		key_len = Buffer::Length(info[0]);
		switch (key_len) {
		case 16:
			cipher_type = EVP_aes_128_ccm();
			break;
		case 24:
			cipher_type = EVP_aes_192_ccm();
			break;
		case 32:
			cipher_type = EVP_aes_256_ccm();
			break;
		default:
			break;
		}
	}
		
	// We want 5 arguments
	// key: 16/24/32 bytes
	// iv
	// plaintext
	// aad
	// auth tag length
	if (info.Length() < 5 || !cipher_type ||
		!Buffer::HasInstance(info[1]) || !Buffer::HasInstance(info[2]) ||
		!Buffer::HasInstance(info[3]) || !info[4]->IsNumber()
	) {
		Nan::ThrowError("encrypt requires a key Buffer, a " \
						"IV Buffer, a plaintext Buffer, an auth_data " \
						"Buffer parameter, and the length of the auth tag");
		return;
	}

	// Make a buffer for the ciphertext that is the same size as the
	// plaintext, but padded to 16 byte increments
	size_t plaintext_len = Buffer::Length(info[2]);
	size_t ciphertext_len = (((plaintext_len - 1) / key_len) + 1) * key_len;
	unsigned char *ciphertext = new unsigned char[ciphertext_len];
	// Make a authentication tag buffer
	int auth_tag_len = info[4]->NumberValue();
	unsigned char *auth_tag = new unsigned char[auth_tag_len];

	// Init OpenSSL interace with the chosen cipher and give it the
	// key and IV
	int outl;
	EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
	EVP_EncryptInit_ex(ctx, cipher_type, NULL, NULL, NULL);
	
	size_t iv_len = Buffer::Length(info[1]);
	// set iv and auth tag length
	EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_CCM_SET_IVLEN, iv_len, NULL);
	EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_CCM_SET_TAG, auth_tag_len, NULL);

	// Init OpenSSL interace with the key and IV
	EVP_EncryptInit_ex(ctx, NULL, NULL,
										(unsigned char *)Buffer::Data(info[0]),
										(unsigned char *)Buffer::Data(info[1]));


	// provide the total plaintext length
	EVP_EncryptUpdate(ctx, NULL, &outl, NULL, plaintext_len);

	// Pass additional authenticated data
	// There is some extra complication here because Buffer::Data seems to
	// return NULL for empty buffers, and NULL makes update not work as we
	// expect it to.  So we force a valid non-NULL pointer for empty buffers.
	int aad_len = Buffer::Length(info[3]);
	EVP_EncryptUpdate(ctx, NULL, &outl, aad_len ?
										(unsigned char *)Buffer::Data(info[3]) : auth_tag,
										aad_len);
	// Encrypt plaintext
	EVP_EncryptUpdate(ctx, ciphertext, &outl,
										(unsigned char *)Buffer::Data(info[2]),
										plaintext_len);
	// Finalize
	EVP_EncryptFinal_ex(ctx, ciphertext + outl, &outl);
	// Get the authentication tag
	EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_CCM_GET_TAG, auth_tag_len, auth_tag);
	// Free the OpenSSL interface structure
	EVP_CIPHER_CTX_free(ctx);

	// Create the return buffers and object
	// We strip padding from the ciphertext
	Nan::MaybeLocal<Object> ciphertext_buf = Nan::CopyBuffer((char*)ciphertext, (uint32_t)plaintext_len);
	Nan::MaybeLocal<Object> auth_tag_buf = Nan::CopyBuffer((char*)auth_tag, AUTH_TAG_LEN);
	Local<Object> return_obj = Nan::New<Object>();
	Nan::Set(return_obj, Nan::New<String>("ciphertext").ToLocalChecked(), ciphertext_buf.ToLocalChecked());
	Nan::Set(return_obj, Nan::New<String>("auth_tag").ToLocalChecked(), auth_tag_buf.ToLocalChecked());

	// Return it
	info.GetReturnValue().Set(return_obj);
}

// Perform GCM mode AES-128 decryption using the provided key, IV, ciphertext,
// auth_data and auth_tag buffers, and return an object containing a "plaintext"
// buffer and an "auth_ok" boolean.

NAN_METHOD(ccm::Decrypt) {
	Nan::HandleScope scope;
	const EVP_CIPHER *cipher_type = NULL;
	int key_len = 0;

	// The key needs to be 16, 24 or 32 bytes and determines the encryption
	// bit level used
	if (info.Length() >= 1 && Buffer::HasInstance(info[0])) {
		key_len = (int)Buffer::Length(info[0]);
		switch (key_len) {
		case 16:
			cipher_type = EVP_aes_128_ccm();
			break;
		case 24:
			cipher_type = EVP_aes_192_ccm();
			break;
		case 32:
			cipher_type = EVP_aes_256_ccm();
			break;
		default:
			break;
		}
	}
	
	// We want 5 buffer arguments
	// key
	// IV
	// ciphertext
	// aad
	// auth_tag
	if (info.Length() < 5 || !Buffer::HasInstance(info[0]) ||
		!Buffer::HasInstance(info[1]) || !Buffer::HasInstance(info[2]) ||
		!Buffer::HasInstance(info[3]) || !Buffer::HasInstance(info[4])
	) {
		Nan::ThrowError("decrypt requires a key Buffer, a " \
						"IV Buffer, a ciphertext Buffer, an auth_data " \
						"Buffer and an auth_tag Buffer parameter");
	}

	// Make a buffer for the plaintext that is the same size as the
	// ciphertext, but padded to 16 byte increments
	size_t ciphertext_len = Buffer::Length(info[2]);
	size_t plaintext_len = (((ciphertext_len - 1) / 16) + 1) * 16;
	int aad_len = Buffer::Length(info[3]);
	unsigned char *plaintext = new unsigned char[plaintext_len];

	// Create the OpenSSL context
	int outl;
	EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
	// Init the OpenSSL interface with the selected AES CCM cipher
	EVP_DecryptInit_ex(ctx, cipher_type, NULL, NULL, NULL);

	// Set the IV length
	iv_len = Buffer::Length(info[1]);
	EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_CCM_SET_IVLEN, iv_len, NULL);

	// Set the expected authentication tag
	size_t auth_tag_len = Buffer::Length(info[4]);
	EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_CCM_SET_TAG, auth_tag_len, Buffer::Data(info[4]));

	// Provide key and iv to OpenSSL
	EVP_DecryptInit_ex(ctx, NULL, NULL,
		(unsigned char *)Buffer::Data(info[0]),
		(unsigned char *)Buffer::Data(info[1])
	);

	// Provide the total ciphertext length
	EVP_DecryptUpdate(ctx, NULL, &outl, NULL, ciphertext_len);
	// Pass additional authenticated data
	// There is some extra complication here because Buffer::Data seems to
	// return NULL for empty buffers, and NULL makes update not work as we
	// expect it to.  So we force a valid non-NULL pointer for empty buffers.
	EVP_DecryptUpdate(ctx, NULL, &outl, Buffer::Length(info[3]) ?
										(unsigned char *)Buffer::Data(info[3]) : plaintext,
										aad_len);
	// Decrypt ciphertext
	bool auth_ok = EVP_DecryptUpdate(ctx, plaintext, &outl,
										(unsigned char *)Buffer::Data(info[2]),
										ciphertext_len);
	// Finalize
	//bool auth_ok = EVP_DecryptFinal_ex(ctx, plaintext + outl, &outl);
	// Free the OpenSSL interface structure
	EVP_CIPHER_CTX_free(ctx);

	// Create the return buffer and object
	// We strip padding from the plaintext
	MaybeLocal<Object> plaintext_buf = Buffer::New(isolate, (char*)plaintext, ciphertext_len);
	Local<Object> return_obj = Object::New(isolate);
	return_obj->Set(String::NewFromUtf8(isolate, "plaintext"), plaintext_buf.FromMaybe(Local<Object>()));
	return_obj->Set(String::NewFromUtf8(isolate, "auth_ok"), Boolean::New(isolate, auth_ok));

	// Return it
	info.GetReturnValue().Set(return_obj);
}