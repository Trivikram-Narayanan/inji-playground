# Report & Findings Templates

## 1. Interoperability Report Template (per test run)

```markdown
## Interoperability Test Report

**Run ID:** <uuid>
**Date:** <date>

| Field | Value |
|---|---|
| Issuer | Inji Certify |
| Wallet | Inji Wallet (mobile) |
| Verifier | Inji Verify |
| Format | SD-JWT VC |
| Proof Type | ES256 |
| Outcome | ✅ PASS / ❌ FAIL |
| Duration | 2.4s |
| Error Code | (if failed) |
| Error Detail | (if failed) |
```

## 2. Full Interoperability Matrix (summary across all runs)

```markdown
## Interoperability Matrix — Summary

| Issuer | Wallet | Verifier | Format | Outcome | Notes |
|---|---|---|---|---|---|
| Inji Certify | Inji Wallet | Inji Verify | W3C VC | ✅ Pass | |
| Inji Certify | Inji Wallet | Inji Verify | SD-JWT VC | ✅ Pass | |
| Inji Certify | Inji Web | Inji Verify | W3C VC | ✅ Pass | |
| External Mock | Inji Wallet | Inji Verify | W3C VC | ❌ Fail | DID method not resolvable |
| Inji Certify | Inji Wallet | Inji Verify | mDoc | ⚠️ Partial | Mock mode only |
```

## 3. Gap / Bug Write-up Template (for GitHub issues)

```markdown
**Title:** [Interop Gap] <short description>

**Summary:**
Brief description of the interoperability issue discovered.

**Components Involved:**
- Issuer: <e.g., Inji Certify>
- Wallet: <e.g., Inji Wallet mobile>
- Verifier: <e.g., Inji Verify>
- Format: <e.g., SD-JWT VC>

**Steps to Reproduce:**
1. ...
2. ...
3. ...

**Expected Behavior:**
...

**Actual Behavior:**
...

**Relevant Payload / Error:**
```json
{ "...": "raw payload or error captured from protocol inspector" }
```

**Suggested Root Cause (if known):**
...

**Environment:**
- Module versions: Certify vX.X, Verify vX.X, Wallet vX.X
- Test run ID: <uuid> (for cross-reference with Playground report)
```

## 4. Demo Video Script Outline (3–5 min)

1. **Intro (15s):** What the playground is and why it matters.
2. **Selector Walkthrough (30s):** Show picking Issuer/Wallet/Verifier/Format.
3. **Live Issuance (60–90s):** Run "Issue a Credential," narrate each timeline step.
4. **Live Presentation & Verification (60–90s):** Run "Present & Verify," show the result banner.
5. **Protocol Inspector (30–45s):** Click into 2–3 steps, show raw JSON payloads.
6. **Report (15–20s):** Show the generated pass/fail report.
7. **(Optional) Tamper Mode (20–30s):** Show a deliberately failed run.
8. **Close (10s):** Recap mandatory scope covered + any good-to-have items completed.
