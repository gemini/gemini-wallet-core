import { describe, expect, test } from "vitest";

import {
  calculateV2Address,
  calculateV3Address,
  calculateWalletAddress,
  generateAuthenticatorIdHash,
  validateWebAuthnKey,
} from "./calculateWalletAddress";

describe("calculateWalletAddress", () => {
  // V2 address tests (uses credentialId)
  test("should calculate exact V2 wallet address for first test wallet", () => {
    const publicKey =
      "0x900fb1e17b7766916a8dad6f8a26b3dbc4fe4f9b1ea5f2d20b7cb31e44c5ff54e63df1865b444a4e7b74a33ef8e3a269f77a6ba5afd072fc641ad5c7f9d626c7" as const;
    const credentialId = "XJ980eHLIRtTop-iX4-wAtSUQ-GxPv_6JIprPE2nN-RBgfJKZPWEWzC-amiRxzfjpks_7q7A8Q";

    const calculatedAddress = calculateV2Address({
      credentialId,
      publicKey,
    });

    const expectedAddress = "0xb5e764ddf8dd5a3613779132e95f389328149b0c";

    expect(calculatedAddress.toLowerCase()).toBe(expectedAddress.toLowerCase());
  });

  test("should calculate exact V2 wallet address for second test wallet", () => {
    const publicKey =
      "0x69933403b13f813f8417b5ef0716f39151dd58702aead4f7e991b5fb80bc868f54baf92948c91613d52a891534927c10a4b6b19bbffef9815459ebd77ea690a6" as const;
    const credentialId = "2X4LvYKqkmbs89vIzAMcOFtw58y4uBIjWRMZUlJ43zc";

    const calculatedAddress = calculateV2Address({
      credentialId,
      publicKey,
    });

    const expectedAddress = "0xdd294fd857f00e533aa9bcbfdd49c76c842238f0";

    expect(calculatedAddress.toLowerCase()).toBe(expectedAddress.toLowerCase());
  });

  // calculateWalletAddress should use V2 (backward compatible)
  test("calculateWalletAddress should use V2 calculation (backward compatible)", () => {
    const publicKey =
      "0x900fb1e17b7766916a8dad6f8a26b3dbc4fe4f9b1ea5f2d20b7cb31e44c5ff54e63df1865b444a4e7b74a33ef8e3a269f77a6ba5afd072fc641ad5c7f9d626c7" as const;
    const credentialId = "XJ980eHLIRtTop-iX4-wAtSUQ-GxPv_6JIprPE2nN-RBgfJKZPWEWzC-amiRxzfjpks_7q7A8Q";

    const v2Address = calculateV2Address({ credentialId, publicKey });
    const defaultAddress = calculateWalletAddress({ credentialId, publicKey });

    expect(defaultAddress).toBe(v2Address);
  });

  // V3 address tests (new, only uses publicKey)
  test("should calculate V3 wallet address (no credentialId)", () => {
    const publicKey =
      "0x900fb1e17b7766916a8dad6f8a26b3dbc4fe4f9b1ea5f2d20b7cb31e44c5ff54e63df1865b444a4e7b74a33ef8e3a269f77a6ba5afd072fc641ad5c7f9d626c7" as const;

    const calculatedAddress = calculateV3Address({ publicKey });

    // V3 addresses are deterministic, verify it returns a valid address
    expect(calculatedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    // The same public key should always produce the same address
    const calculatedAddress2 = calculateV3Address({ publicKey });
    expect(calculatedAddress).toBe(calculatedAddress2);
  });

  test("should calculate different V3 address for different public keys", () => {
    const publicKey1 =
      "0x900fb1e17b7766916a8dad6f8a26b3dbc4fe4f9b1ea5f2d20b7cb31e44c5ff54e63df1865b444a4e7b74a33ef8e3a269f77a6ba5afd072fc641ad5c7f9d626c7" as const;
    const publicKey2 =
      "0x69933403b13f813f8417b5ef0716f39151dd58702aead4f7e991b5fb80bc868f54baf92948c91613d52a891534927c10a4b6b19bbffef9815459ebd77ea690a6" as const;

    const address1 = calculateV3Address({ publicKey: publicKey1 });
    const address2 = calculateV3Address({ publicKey: publicKey2 });

    expect(address1).not.toBe(address2);
  });

  test("V3 address should be different from V2 address for same public key", () => {
    const publicKey =
      "0x900fb1e17b7766916a8dad6f8a26b3dbc4fe4f9b1ea5f2d20b7cb31e44c5ff54e63df1865b444a4e7b74a33ef8e3a269f77a6ba5afd072fc641ad5c7f9d626c7" as const;
    const credentialId = "XJ980eHLIRtTop-iX4-wAtSUQ-GxPv_6JIprPE2nN-RBgfJKZPWEWzC-amiRxzfjpks_7q7A8Q";

    const v2Address = calculateV2Address({ credentialId, publicKey });
    const v3Address = calculateV3Address({ publicKey });

    // V3 uses different salt and bootstrap, so address should be different
    expect(v3Address).not.toBe(v2Address);
  });

  test("should validate WebAuthn keys correctly", () => {
    const publicKey =
      "0x900fb1e17b7766916a8dad6f8a26b3dbc4fe4f9b1ea5f2d20b7cb31e44c5ff54e63df1865b444a4e7b74a33ef8e3a269f77a6ba5afd072fc641ad5c7f9d626c7";

    const pubKeyX = `0x${publicKey.slice(2, 66)}`;
    const pubKeyY = `0x${publicKey.slice(66, 130)}`;

    const webAuthnData = {
      pubKeyX: BigInt(pubKeyX),
      pubKeyY: BigInt(pubKeyY),
    };

    const isValid = validateWebAuthnKey(webAuthnData);
    expect(isValid).toBe(true);
  });

  test("should generate correct authenticator ID hash", () => {
    const credentialId = "XJ980eHLIRtTop-iX4-wAtSUQ-GxPv_6JIprPE2nN-RBgfJKZPWEWzC-amiRxzfjpks_7q7A8Q";

    const hash = generateAuthenticatorIdHash(credentialId);
    const expectedHash = "0xa919a485eff73c853844904a444f102f42d302320d3fee7c64136b0f4ef8357c";

    expect(hash.toLowerCase()).toBe(expectedHash.toLowerCase());
  });

  test("should throw error for invalid public key (V3)", () => {
    expect(() => {
      calculateV3Address({
        publicKey: "0xinvalid",
      });
    }).toThrow("Invalid public key: must be 64-byte hex string (0x + 128 chars)");
  });

  test("should throw error for invalid public key (V2)", () => {
    expect(() => {
      calculateV2Address({
        credentialId: "test",
        publicKey: "0xinvalid",
      });
    }).toThrow("Invalid public key: must be 64-byte hex string (0x + 128 chars)");
  });

  test("should use default index of 0 for V2 addresses", () => {
    const publicKey =
      "0x900fb1e17b7766916a8dad6f8a26b3dbc4fe4f9b1ea5f2d20b7cb31e44c5ff54e63df1865b444a4e7b74a33ef8e3a269f77a6ba5afd072fc641ad5c7f9d626c7" as const;
    const credentialId = "XJ980eHLIRtTop-iX4-wAtSUQ-GxPv_6JIprPE2nN-RBgfJKZPWEWzC-amiRxzfjpks_7q7A8Q";

    const address1 = calculateV2Address({ credentialId, publicKey });
    const address2 = calculateV2Address({ credentialId, index: 0n, publicKey });

    expect(address1).toBe(address2);
  });
});
