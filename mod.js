const {
	ccmDecrypt,
	ccmEncrypt,
	gcmDecrypt,
	gcmEncrypt
} = require("./index.js");

module.exports = {
	ccm: {
		encrypt: ccmEncrypt,
		decrypt: ccmDecrypt
	},
	gcm: {
		encrypt: gcmEncrypt,
		decrypt: gcmDecrypt
	}
}