# 🛡️ Inji Interoperability Matrix Test Results

**Overall CI Status**: ✅ ALL 13 TEST CASES PASSED

| # | Format | Tamper | Expected | Actual | Status |
|---|---|---|---|---|---|
| 1 | w3c-vc-jsonld | none | valid (no-error) | valid (no-error) | ✅ Pass |
| 2 | w3c-vc-jsonld | bad-signature | invalid (SIGNATURE_INVALID) | invalid (SIGNATURE_INVALID) | ✅ Pass |
| 3 | w3c-vc-jsonld | claim-corruption | invalid (SIGNATURE_INVALID) | invalid (SIGNATURE_INVALID) | ✅ Pass |
| 4 | w3c-vc-jsonld | expired | valid-but-expired (CREDENTIAL_EXPIRED) | valid-but-expired (CREDENTIAL_EXPIRED) | ✅ Pass |
| 5 | sd-jwt-vc | none | valid (no-error) | valid (no-error) | ✅ Pass |
| 6 | sd-jwt-vc | bad-signature | invalid (SIGNATURE_INVALID) | invalid (SIGNATURE_INVALID) | ✅ Pass |
| 7 | sd-jwt-vc | claim-corruption | invalid (CLAIM_MISMATCH) | invalid (CLAIM_MISMATCH) | ✅ Pass |
| 8 | sd-jwt-vc | expired | valid-but-expired (CREDENTIAL_EXPIRED) | valid-but-expired (CREDENTIAL_EXPIRED) | ✅ Pass |
| 9 | mdoc | none | valid (no-error) | valid (no-error) | ✅ Pass |
| 10 | mdoc | bad-signature | invalid (SIGNATURE_INVALID) | invalid (SIGNATURE_INVALID) | ✅ Pass |
| 11 | mdoc | claim-corruption | invalid (CLAIM_MISMATCH) | invalid (CLAIM_MISMATCH) | ✅ Pass |
| 12 | mdoc | expired | valid-but-expired (CREDENTIAL_EXPIRED) | valid-but-expired (CREDENTIAL_EXPIRED) | ✅ Pass |
| 13 | w3c-vc-jsonld | none | invalid (DID_METHOD_GAP) | invalid (DID_METHOD_GAP) | ✅ Pass |

---

## Interoperability Matrix — Summary

| Issuer | Wallet | Verifier | Format | Outcome | Notes |
|---|---|---|---|---|---|
| external-mock | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | DID_METHOD_GAP |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ❌ Fail | CREDENTIAL_EXPIRED |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ❌ Fail | CLAIM_MISMATCH |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ❌ Fail | SIGNATURE_INVALID |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ❌ Fail | CREDENTIAL_EXPIRED |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ❌ Fail | CLAIM_MISMATCH |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ❌ Fail | SIGNATURE_INVALID |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | CREDENTIAL_EXPIRED |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | SIGNATURE_INVALID |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | SIGNATURE_INVALID |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | UNKNOWN_ERROR |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ❌ Fail | FORMAT_MISMATCH |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ❌ Fail | FORMAT_MISMATCH |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | UNKNOWN_ERROR |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ❌ Fail | FORMAT_MISMATCH |
| external-mock | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | DID_METHOD_GAP |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ❌ Fail | CREDENTIAL_EXPIRED |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ❌ Fail | CLAIM_MISMATCH |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ❌ Fail | SIGNATURE_INVALID |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ❌ Fail | CREDENTIAL_EXPIRED |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ❌ Fail | CLAIM_MISMATCH |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ❌ Fail | SIGNATURE_INVALID |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | CREDENTIAL_EXPIRED |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | SIGNATURE_INVALID |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | SIGNATURE_INVALID |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ✅ Pass |  |
| external-mock | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ❌ Fail | DID_METHOD_GAP |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | mdoc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | w3c-vc-jsonld | ✅ Pass |  |
| inji-certify | inji-wallet-mobile | inji-verify | sd-jwt-vc | ✅ Pass |  |
