const {
	ccmDecrypt,
	ccmEncrypt,
	gcmDecrypt,
	gcmEncrypt
} = require("./lib.js");

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