// Test module for node-aes-gcm
// Verifies against applicable test cases documented in:
// http://csrc.nist.gov/groups/ST/toolkit/BCM/documents
// /proposedmodes/gcm/gcm-revised-spec.pdf

var fs = require("fs");
var should = require("should");
const { gcm } = require("..");

describe("node-aes-gcm", function () {
  var key, iv, plaintext, aad, ciphertext, auth_tag;
  var encrypted,
    decrypted,
    decryptedBadCiphertext,
    decryptedBadAad,
    decryptedBadAuthTag;
  var badCiphertext = new Buffer("Bad ciphertext"),
    badAad = new Buffer("Bad AAD"),
    badAuthTag = new Buffer("0000000000000000");

  function runEncryptDecryptTestCases(nist) {
    before(function () {
      encrypted = gcm.encrypt(key, iv, plaintext, aad);
      if (encrypted && encrypted.ciphertext && encrypted.auth_tag) {
        decrypted = gcm.decrypt(
          key,
          iv,
          encrypted.ciphertext,
          aad,
          encrypted.auth_tag
        );
        decryptedBadCiphertext = gcm.decrypt(
          key,
          iv,
          badCiphertext,
          aad,
          encrypted.auth_tag
        );
        decryptedBadAad = gcm.decrypt(
          key,
          iv,
          encrypted.ciphertext,
          badAad,
          encrypted.auth_tag
        );
        decryptedBadAuthTag = gcm.decrypt(
          key,
          iv,
          encrypted.ciphertext,
          aad,
          badAuthTag
        );
      } else {
        decrypted = null;
      }
    });

    if (nist) {
      it("should match the NIST ciphertext when encrypted", function () {
        encrypted.should.have.ownProperty("ciphertext");
        encrypted.ciphertext.should.be.an.instanceOf(Buffer);
        encrypted.ciphertext.equals(ciphertext).should.be.ok();
      });

      it("should match the NIST authentication tag when encrypted", function () {
        encrypted.should.have.ownProperty("auth_tag");
        encrypted.auth_tag.should.be.an.instanceOf(Buffer);
        encrypted.auth_tag.equals(auth_tag).should.be.ok();
      });
    }

    it("should decrypt back to the original plaintext", function () {
      decrypted.should.have.ownProperty("plaintext");
      decrypted.plaintext.should.be.an.instanceOf(Buffer);
      decrypted.plaintext.equals(plaintext).should.be.ok();
    });

    it("should report authentication ok when decrypted", function () {
      decrypted.should.have.ownProperty("auth_ok");
      decrypted.auth_ok.should.be.a.Boolean();
      decrypted.auth_ok.should.be.ok();
    });

    it("should fail authentication when decrypting bad ciphertext", function () {
      decryptedBadCiphertext.should.have.ownProperty("auth_ok");
      decryptedBadCiphertext.auth_ok.should.be.a.Boolean();
      decryptedBadCiphertext.auth_ok.should.not.be.ok();
    });

    it.skip("should decrypt correctly even with bad AAD", function () {
      decryptedBadAad.should.have.ownProperty("plaintext");
      decryptedBadAad.plaintext.should.be.an.instanceOf(Buffer);
      decryptedBadAad.plaintext.equals(plaintext).should.be.ok();
    });

    it("should fail authentication when decrypting bad AAD", function () {
      decryptedBadAad.should.have.ownProperty("auth_ok");
      decryptedBadAad.auth_ok.should.be.a.Boolean();
      decryptedBadAad.auth_ok.should.not.be.ok();
    });

    it.skip("should decrypt correctly even with bad authentication tag", function () {
      decryptedBadAuthTag.should.have.ownProperty("plaintext");
      decryptedBadAuthTag.plaintext.should.be.an.instanceOf(Buffer);
      decryptedBadAuthTag.plaintext.equals(plaintext).should.be.ok();
    });

    it("should fail authentication with a bad authentication tag", function () {
      decryptedBadAuthTag.should.have.ownProperty("auth_ok");
      decryptedBadAuthTag.auth_ok.should.be.a.Boolean();
      decryptedBadAuthTag.auth_ok.should.not.be.ok();
    });
  }

  describe("NIST Test Case 1", function () {
    before(function () {
      key = new Buffer("00000000000000000000000000000000", "hex");
      iv = new Buffer("000000000000000000000000", "hex");
      plaintext = new Buffer([]);
      aad = new Buffer([]);
      ciphertext = new Buffer([]);
      auth_tag = new Buffer("58e2fccefa7e3061367f1d57a4e7455a", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 2", function () {
    before(function () {
      key = new Buffer("00000000000000000000000000000000", "hex");
      iv = new Buffer("000000000000000000000000", "hex");
      plaintext = new Buffer("00000000000000000000000000000000", "hex");
      aad = new Buffer([]);
      ciphertext = new Buffer("0388dace60b6a392f328c2b971b2fe78", "hex");
      auth_tag = new Buffer("ab6e47d42cec13bdf53a67b21257bddf", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 3", function () {
    before(function () {
      key = new Buffer("feffe9928665731c6d6a8f9467308308", "hex");
      iv = new Buffer("cafebabefacedbaddecaf888", "hex");
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b391aafd255",
        "hex"
      );
      aad = new Buffer([]);
      ciphertext = new Buffer(
        "42831ec2217774244b7221b784d0d49c" +
          "e3aa212f2c02a4e035c17e2329aca12e" +
          "21d514b25466931c7d8f6a5aac84aa05" +
          "1ba30b396a0aac973d58e091473f5985",
        "hex"
      );
      auth_tag = new Buffer("4d5c2af327cd64a62cf35abd2ba6fab4", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 4", function () {
    before(function () {
      key = new Buffer("feffe9928665731c6d6a8f9467308308", "hex");
      iv = new Buffer("cafebabefacedbaddecaf888", "hex");
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b39",
        "hex"
      );
      aad = new Buffer("feedfacedeadbeeffeedfacedeadbeefabaddad2", "hex");
      ciphertext = new Buffer(
        "42831ec2217774244b7221b784d0d49c" +
          "e3aa212f2c02a4e035c17e2329aca12e" +
          "21d514b25466931c7d8f6a5aac84aa05" +
          "1ba30b396a0aac973d58e091",
        "hex"
      );
      auth_tag = new Buffer("5bc94fbc3221a5db94fae95ae7121a47", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe.skip("NIST Test Case 5", function () {
    before(function () {
      key = new Buffer("feffe9928665731c6d6a8f9467308308", "hex");
      iv = new Buffer("cafebabefacedbad", "hex");
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b39",
        "hex"
      );
      aad = new Buffer("feedfacedeadbeeffeedfacedeadbeefabaddad2", "hex");
      ciphertext = new Buffer(
        "61353b4c2806934a777ff51fa22a4755" +
          "699b2a714fcdc6f83766e5f97b6c7423" +
          "73806900e49f24b22b097544d4896b42" +
          "4989b5e1ebac0f07c23f4598",
        "hex"
      );
      auth_tag = new Buffer("3612d2e79e3b0785561be14aaca2fccb", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe.skip("NIST Test Case 6", function () {
    before(function () {
      key = new Buffer("feffe9928665731c6d6a8f9467308308", "hex");
      iv = new Buffer(
        "9313225df88406e555909c5aff5269aa" +
          "6a7a9538534f7da1e4c303d2a318a728" +
          "c3c0c95156809539fcf0e2429a6b5254" +
          "16aedbf5a0de6a57a637b39b",
        "hex"
      );
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b39",
        "hex"
      );
      aad = new Buffer("feedfacedeadbeeffeedfacedeadbeefabaddad2", "hex");
      ciphertext = new Buffer(
        "8ce24998625615b603a033aca13fb894" +
          "be9112a5c3a211a8ba262a3cca7e2ca7" +
          "01e4a9a4fba43c90ccdcb281d48c7c6f" +
          "d62875d2aca417034c34aee5",
        "hex"
      );
      auth_tag = new Buffer("619cc5aefffe0bfa462af43c1699d050", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 7", function () {
    before(function () {
      key = new Buffer(
        "00000000000000000000000000000000" + "0000000000000000",
        "hex"
      );
      iv = new Buffer("000000000000000000000000", "hex");
      plaintext = new Buffer([]);
      aad = new Buffer([]);
      ciphertext = new Buffer([]);
      auth_tag = new Buffer("cd33b28ac773f74ba00ed1f312572435", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 8", function () {
    before(function () {
      key = new Buffer(
        "00000000000000000000000000000000" + "0000000000000000",
        "hex"
      );
      iv = new Buffer("000000000000000000000000", "hex");
      plaintext = new Buffer("00000000000000000000000000000000", "hex");
      aad = new Buffer([]);
      ciphertext = new Buffer("98e7247c07f0fe411c267e4384b0f600", "hex");
      auth_tag = new Buffer("2ff58d80033927ab8ef4d4587514f0fb", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 9", function () {
    before(function () {
      key = new Buffer(
        "feffe9928665731c6d6a8f9467308308" + "feffe9928665731c",
        "hex"
      );
      iv = new Buffer("cafebabefacedbaddecaf888", "hex");
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b391aafd255",
        "hex"
      );
      aad = new Buffer([]);
      ciphertext = new Buffer(
        "3980ca0b3c00e841eb06fac4872a2757" +
          "859e1ceaa6efd984628593b40ca1e19c" +
          "7d773d00c144c525ac619d18c84a3f47" +
          "18e2448b2fe324d9ccda2710acade256",
        "hex"
      );
      auth_tag = new Buffer("9924a7c8587336bfb118024db8674a14", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 10", function () {
    before(function () {
      key = new Buffer(
        "feffe9928665731c6d6a8f9467308308" + "feffe9928665731c",
        "hex"
      );
      iv = new Buffer("cafebabefacedbaddecaf888", "hex");
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b39",
        "hex"
      );
      aad = new Buffer("feedfacedeadbeeffeedfacedeadbeefabaddad2", "hex");
      ciphertext = new Buffer(
        "3980ca0b3c00e841eb06fac4872a2757" +
          "859e1ceaa6efd984628593b40ca1e19c" +
          "7d773d00c144c525ac619d18c84a3f47" +
          "18e2448b2fe324d9ccda2710",
        "hex"
      );
      auth_tag = new Buffer("2519498e80f1478f37ba55bd6d27618c", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe.skip("NIST Test Case 11", function () {
    before(function () {
      key = new Buffer(
        "feffe9928665731c6d6a8f9467308308" + "feffe9928665731c",
        "hex"
      );
      iv = new Buffer("cafebabefacedbad", "hex");
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b39",
        "hex"
      );
      aad = new Buffer("feedfacedeadbeeffeedfacedeadbeefabaddad2", "hex");
      ciphertext = new Buffer(
        "0f10f599ae14a154ed24b36e25324db8" +
          "c566632ef2bbb34f8347280fc4507057" +
          "fddc29df9a471f75c66541d4d4dad1c9" +
          "e93a19a58e8b473fa0f062f7",
        "hex"
      );
      auth_tag = new Buffer("65dcc57fcf623a24094fcca40d3533f8", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe.skip("NIST Test Case 12", function () {
    before(function () {
      key = new Buffer(
        "feffe9928665731c6d6a8f9467308308" + "feffe9928665731c",
        "hex"
      );
      iv = new Buffer(
        "9313225df88406e555909c5aff5269aa" +
          "6a7a9538534f7da1e4c303d2a318a728" +
          "c3c0c95156809539fcf0e2429a6b5254" +
          "16aedbf5a0de6a57a637b39b",
        "hex"
      );
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b39",
        "hex"
      );
      aad = new Buffer("feedfacedeadbeeffeedfacedeadbeefabaddad2", "hex");
      ciphertext = new Buffer(
        "d27e88681ce3243c4830165a8fdcf9ff" +
          "1de9a1d8e6b447ef6ef7b79828666e45" +
          "81e79012af34ddd9e2f037589b292db3" +
          "e67c036745fa22e7e9b7373b",
        "hex"
      );
      auth_tag = new Buffer("dcf566ff291c25bbb8568fc3d376a6d9", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 13", function () {
    before(function () {
      key = new Buffer(
        "00000000000000000000000000000000" + "00000000000000000000000000000000",
        "hex"
      );
      iv = new Buffer("000000000000000000000000", "hex");
      plaintext = new Buffer([]);
      aad = new Buffer([]);
      ciphertext = new Buffer([]);
      auth_tag = new Buffer("530f8afbc74536b9a963b4f1c4cb738b", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 14", function () {
    before(function () {
      key = new Buffer(
        "00000000000000000000000000000000" + "00000000000000000000000000000000",
        "hex"
      );
      iv = new Buffer("000000000000000000000000", "hex");
      plaintext = new Buffer("00000000000000000000000000000000", "hex");
      aad = new Buffer([]);
      ciphertext = new Buffer("cea7403d4d606b6e074ec5d3baf39d18", "hex");
      auth_tag = new Buffer("d0d1c8a799996bf0265b98b5d48ab919", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 15", function () {
    before(function () {
      key = new Buffer(
        "feffe9928665731c6d6a8f9467308308" + "feffe9928665731c6d6a8f9467308308",
        "hex"
      );
      iv = new Buffer("cafebabefacedbaddecaf888", "hex");
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b391aafd255",
        "hex"
      );
      aad = new Buffer([]);
      ciphertext = new Buffer(
        "522dc1f099567d07f47f37a32a84427d" +
          "643a8cdcbfe5c0c97598a2bd2555d1aa" +
          "8cb08e48590dbb3da7b08b1056828838" +
          "c5f61e6393ba7a0abcc9f662898015ad",
        "hex"
      );
      auth_tag = new Buffer("b094dac5d93471bdec1a502270e3cc6c", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe("NIST Test Case 16", function () {
    before(function () {
      key = new Buffer(
        "feffe9928665731c6d6a8f9467308308" + "feffe9928665731c6d6a8f9467308308",
        "hex"
      );
      iv = new Buffer("cafebabefacedbaddecaf888", "hex");
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b39",
        "hex"
      );
      aad = new Buffer("feedfacedeadbeeffeedfacedeadbeefabaddad2", "hex");
      ciphertext = new Buffer(
        "522dc1f099567d07f47f37a32a84427d" +
          "643a8cdcbfe5c0c97598a2bd2555d1aa" +
          "8cb08e48590dbb3da7b08b1056828838" +
          "c5f61e6393ba7a0abcc9f662",
        "hex"
      );
      auth_tag = new Buffer("76fc6ece0f4e1768cddf8853bb2d551b", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe.skip("NIST Test Case 17", function () {
    before(function () {
      key = new Buffer(
        "feffe9928665731c6d6a8f9467308308" + "feffe9928665731c6d6a8f9467308308",
        "hex"
      );
      iv = new Buffer("cafebabefacedbad", "hex");
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b39",
        "hex"
      );
      aad = new Buffer("feedfacedeadbeeffeedfacedeadbeefabaddad2", "hex");
      ciphertext = new Buffer(
        "c3762df1ca787d32ae47c13bf19844cb" +
          "af1ae14d0b976afac52ff7d79bba9de0" +
          "feb582d33934a4f0954cc2363bc73f78" +
          "62ac430e64abe499f47c9b1f",
        "hex"
      );
      auth_tag = new Buffer("3a337dbf46a792c45e454913fe2ea8f2", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe.skip("NIST Test Case 18", function () {
    before(function () {
      key = new Buffer(
        "feffe9928665731c6d6a8f9467308308" + "feffe9928665731c6d6a8f9467308308",
        "hex"
      );
      iv = new Buffer(
        "9313225df88406e555909c5aff5269aa" +
          "6a7a9538534f7da1e4c303d2a318a728" +
          "c3c0c95156809539fcf0e2429a6b5254" +
          "16aedbf5a0de6a57a637b39b",
        "hex"
      );
      plaintext = new Buffer(
        "d9313225f88406e5a55909c5aff5269a" +
          "86a7a9531534f7da2e4c303d8a318a72" +
          "1c3c0c95956809532fcf0e2449a6b525" +
          "b16aedf5aa0de657ba637b39",
        "hex"
      );
      aad = new Buffer("feedfacedeadbeeffeedfacedeadbeefabaddad2", "hex");
      ciphertext = new Buffer(
        "5a8def2f0c9e53f1f75d7853659e2a20" +
          "eeb2b22aafde6419a058ab4f6f746bf4" +
          "0fc0c3b780f244452da3ebf1c5d82cde" +
          "a2418997200ef82e44ae7e3f",
        "hex"
      );
      auth_tag = new Buffer("a44a8266ee1c8eb0c8b5d4cf5ae9f19a", "hex");
    });

    runEncryptDecryptTestCases(true);
  });

  describe.skip("Its own binary module", function () {
    before(function (done) {
      key = new Buffer("8888888888888888");
      iv = new Buffer("666666666666");
      fs.readFile(
        "./build/Release/node-aead-crypto.node",
        function (err, data) {
          if (err) throw err;
          plaintext = data;
          done();
        }
      );
      aad = new Buffer([]);
      ciphertext = null;
      auth_tag = null;
    });

    runEncryptDecryptTestCases(false);
  });
});
