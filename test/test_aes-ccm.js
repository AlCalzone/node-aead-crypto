var assert = require("assert");

const { ccm } = require("..");

var TEST_CASES = [
  {
    key: "404142434445464748494a4b4c4d4e4f",
    iv: "101112131415161718191a1b",
    plain: "202122232425262728292a2b2c2d2e2f3031323334353637",
    aad: "000102030405060708090a0b0c0d0e0f10111213",
    ct: "e3b201a9f5b71a7a9b1ceaeccd97e70b6176aad9a4428aa5",
    tag: "484392fbc1b09951",
    tampered: false,
  },
  {
    key: "C0C1C2C3C4C5C6C7C8C9CACBCCCDCECF",
    iv: "00000003020100A0A1A2A3A4A5",
    plain: "08090A0B0C0D0E0F101112131415161718191A1B1C1D1E",
    aad: "0001020304050607",
    ct: "588C979A61C663D2F066D0C2C0F989806D5F6B61DAC384",
    tag: "17E8D12CFDF926E0",
    tampered: false,
  },
  {
    key: "C0C1C2C3C4C5C6C7C8C9CACBCCCDCECF",
    iv: "00000004030201A0A1A2A3A4A5",
    plain: "08090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F",
    aad: "0001020304050607",
    ct: "72C91A36E135F8CF291CA894085C87E3CC15C439C9E43A3B",
    tag: "A091D56E10400916",
    tampered: false,
  },
  {
    key: "C0C1C2C3C4C5C6C7C8C9CACBCCCDCECF",
    iv: "00000005040302A0A1A2A3A4A5",
    plain: "08090A0B0C0D0E0F101112131415161718191A1B1C1D1E1F20",
    aad: "0001020304050607",
    ct: "51B1E5F44A197D1DA46B0F8E2D282AE871E838BB64DA859657",
    tag: "4ADAA76FBD9FB0C5",
    tampered: false,
  },
  {
    key: "C0C1C2C3C4C5C6C7C8C9CACBCCCDCECF",
    iv: "00000006050403A0A1A2A3A4A5",
    plain: "0C0D0E0F101112131415161718191A1B1C1D1E",
    aad: "000102030405060708090A0B",
    ct: "A28C6865939A9A79FAAA5C4C2A9D4A91CDAC8C",
    tag: "96C861B9C9E61EF1",
    tampered: false,
  },
  {
    key: "C0C1C2C3C4C5C6C7C8C9CACBCCCDCECF",
    iv: "00000007060504A0A1A2A3A4A5",
    plain: "0C0D0E0F101112131415161718191A1B1C1D1E1F",
    aad: "000102030405060708090A0B",
    ct: "DCF1FB7B5D9E23FB9D4E131253658AD86EBDCA3E",
    tag: "51E83F077D9C2D93",
    tampered: false,
  },
  {
    key: "C0C1C2C3C4C5C6C7C8C9CACBCCCDCECF",
    iv: "00000007060504A0A1A2A3A4A5",
    plain: "0C0D0E0F101112131415161718191A1B1C1D1E1F",
    aad: "000102030405060708090A0B",
    ct: "DCF1FB7B5D9E23FB9D4E131253658AD86EBDCA3E",
    tag: "51E83F077D9C2D94",
    tampered: true,
  },
  {
    key: "C0C1C2C3C4C5C6C7C8C9CACBCCCDCECF",
    iv: "00000007060504A0A1A2A3A4A5",
    plain: "0C0D0E0F101112131415161718191A1B1C1D1E1F",
    aad: "000102030405060708090A0B",
    ct: "DCF1FB7B5D9E23FB9D4E131253658AD86EBDCA3F",
    tag: "51E83F077D9C2D93",
    tampered: true,
  },
];

for (var i in TEST_CASES) {
  var test = TEST_CASES[i];
  //console.log(test);
  var res = ccm.encrypt(
    Buffer.from(test.key, "hex"),
    Buffer.from(test.iv, "hex"),
    Buffer.from(test.plain, "hex"),
    Buffer.from(test.aad, "hex"),
    test.tag.length / 2
  );
  //console.log(res);

  if (!test.tampered) {
    assert.equal(
      res.ciphertext.toString("hex").toUpperCase(),
      test.ct.toUpperCase()
    );
    assert.equal(
      res.auth_tag.toString("hex").toUpperCase(),
      test.tag.toUpperCase()
    );
  }

  var dres = ccm.decrypt(
    Buffer.from(test.key, "hex"),
    Buffer.from(test.iv, "hex"),
    Buffer.from(test.ct, "hex"),
    Buffer.from(test.aad, "hex"),
    Buffer.from(test.tag, "hex")
  );
  //console.log(dres);

  if (!test.tampered) {
    assert.ok(dres.auth_ok);
    assert.equal(
      dres.plaintext.toString("hex").toUpperCase(),
      test.plain.toUpperCase()
    );
  } else {
    assert.equal(dres.auth_ok, false);
  }
}
console.log("aes-ccm test completed");
