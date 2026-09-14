# Test Plan

## 1. Test Levels

### 1.1 Unit Tests
- BFF request/response mapping functions (FlowConfig → Certify/Verify API calls).
- Report-generation logic (event list → Report object).
- Error-code classification logic.

### 1.2 Integration Tests
- BFF ↔ Inji Certify: create offer, exchange token, receive credential.
- BFF ↔ Inji Verify: send authorization request, receive verification result.
- End-to-end flow through Docker Compose stack (can use `inji-verify`'s existing `api-test` patterns as a reference).

### 1.3 Manual / Exploratory Tests
- Full UI walkthrough: selector → live flow → inspector → report, for each mandatory format.
- Mobile wallet QR scan flow (requires physical/emulated device + ngrok).
- Tamper mode scenarios (claim corruption, expiry, bad signature).
- Cross-ecosystem mock scenarios (if implemented).

## 2. Test Matrix (Mandatory Scope)

| Issuer | Wallet | Verifier | Format | Expected Outcome |
|---|---|---|---|---|
| Inji Certify | Inji Wallet (mobile) | Inji Verify | W3C VC JSON-LD | Pass |
| Inji Certify | Inji Wallet (mobile) | Inji Verify | SD-JWT VC | Pass |
| Inji Certify | Inji Web | Inji Verify | W3C VC JSON-LD | Pass |
| Inji Certify | Inji Web | Inji Verify | SD-JWT VC | Pass |

## 3. Test Matrix (Good-to-have Scope)

| Issuer | Wallet | Verifier | Format | Scenario | Expected Outcome |
|---|---|---|---|---|---|
| Inji Certify | Inji Wallet | Inji Verify | Any | Tamper: bad signature | Invalid |
| Inji Certify | Inji Wallet | Inji Verify | Any | Tamper: expired | Valid-but-Expired or Invalid (per spec) |
| Inji Certify | Inji Wallet | Inji Verify | mDoc | Mock mDoc issuance | Pass or documented gap |
| External Mock Issuer | Inji Wallet | Inji Verify | W3C VC | Cross-ecosystem | Pass or documented gap |
| Inji Certify | Inji Wallet | External Mock Verifier | SD-JWT VC | Cross-ecosystem | Pass or documented gap |

## 4. Test Case Template

```
Test ID: TC-001
Title: Issue + Verify W3C VC via Inji Wallet Mobile
Preconditions: Docker Compose stack up, mobile wallet installed, ngrok tunnel active
Steps:
  1. Select Issuer=Inji Certify, Wallet=Inji Wallet Mobile, Verifier=Inji Verify, Format=W3C VC JSON-LD
  2. Click "Run Test"
  3. Scan QR with mobile wallet
  4. Approve credential offer in wallet
  5. Trigger presentation from wallet to verifier
Expected Result: Timeline shows all steps ✓, final banner shows "Valid", report generated with outcome=pass
Actual Result: [fill in during execution]
Status: [Pass/Fail]
```

## 5. Regression Considerations
- Re-run the full mandatory matrix whenever Certify/Wallet/Verify module versions are bumped.
- Track results in the historical dashboard (if built) to catch regressions across Inji releases.

## 6. Exit Criteria for "Test Complete"
- All mandatory matrix rows executed and passing (or failures documented with root cause).
- At least one tamper-mode scenario executed and correctly reported as Invalid.
- All results captured in the Report/Dashboard for the final deliverable write-up.
