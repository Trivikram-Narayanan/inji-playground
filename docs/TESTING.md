# Testing Guide — Inji Interoperability Playground

A hands-on manual and API test plan for the running app: Simulated Mode, Real Mode, Tamper Mode, all three credential formats, the API surface, and the automated suite.

> An interactive, checkbox-and-notes version of this same plan (state saved locally in the browser) is also available as a published artifact — ask for the link if you'd rather work through it there.

## Contents

1. [Setup](#1-setup)
2. [5-minute smoke test](#2-5-minute-smoke-test)
3. [Feature checklist](#3-feature-checklist)
4. [Simulated Mode: format × tamper matrix](#4-simulated-mode-format--tamper-matrix)
5. [Real Mode matrix](#5-real-mode-matrix)
6. [API spot-checks](#6-api-spot-checks)
7. [Automated suite](#7-automated-suite)
8. [Known issues — don't re-file these](#8-known-issues--dont-re-file-these)
9. [Filing a bug](#9-filing-a-bug)

---

## 1. Setup

Two servers, run separately. Node v18+.

```bash
cd backend
npm install
npm run dev
# → http://localhost:3000
```

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

- [ ] Backend starts cleanly, no errors in terminal — `curl http://localhost:3000/health` returns `{"status":"ok"}`
- [ ] Frontend loads at `localhost:5173` — Selector, empty timeline placeholder, and top nav (00_Overview / 01_Laboratory / 02_Observatory) all render

---

## 2. 5-minute smoke test

Do this first. If any of these fail, stop and file a bug before running the full matrix below — no point testing 20 more cases against a broken build.

- [ ] Run a default Simulated-Mode test: leave everything at default (Inji Certify / Inji Wallet Mobile / Inji Verify / W3C VC JSON-LD, Real Mode off, Tamper off) → click **Run Experiment** → the "Credential Offer Created" step appears
- [ ] Click **Advance** — all 6 timeline steps complete in order: `credential_offer` → `token_exchange` → `credential_issued` → `authorization_request` → `presentation` → `verification_result`
- [ ] Green "CRYPTOGRAPHIC VERIFICATION PASSED" banner appears
- [ ] Click a timeline step — raw JSON payload shows in the Protocol Inspector
- [ ] Click **View Certificate** — modal shows outcome and duration, JSON export works
- [ ] 02_Observatory shows this run in the history with correct stats

---

## 3. Feature checklist

Broader pass through individual UI behaviors, once the smoke test passes.

- [ ] Real Mode toggle changes the mock-UIN hint text and disables/greys unsupported formats — flip Real Mode on, SD-JWT VC should show a "sim only" tag and look disabled
- [ ] A Real Mode run shows a red **LIVE** badge next to "Live Timeline"
- [ ] Timeline updates live without refreshing or clicking anything extra — open DevTools → Network, filter "stream": you should see an `EventSource` connection per run, not repeated polling requests
- [ ] A FAILED run (e.g. Real Mode hitting the known sandbox bug, see [§8](#8-known-issues--dont-re-file-these)) shows the red "FLOW FAILED (SEE PROTOCOL INSPECTOR)" banner, not a silent stall
- [ ] A failed start shows a dismissible red error banner above the timeline
- [ ] Dashboard stat cards (total / passed / failed / pass rate / most common error) match what you'd hand-count from the history table
- [ ] Narrow the browser window to phone width (~400px) — layout stacks cleanly, nothing overlaps or clips

---

## 4. Simulated Mode: format × tamper matrix

These 12 cases should always pass, deterministically, with no external dependency. This is the core regression matrix — run it after any backend change.

| # | Format | Tamper | Expected result | Expected error code |
|---|---|---|---|---|
| 1 | W3C VC (JSON-LD) | off | `valid` | — |
| 2 | W3C VC (JSON-LD) | bad-signature | `invalid` | `SIGNATURE_INVALID` |
| 3 | W3C VC (JSON-LD) | claim-corruption | `invalid` | `SIGNATURE_INVALID` * |
| 4 | W3C VC (JSON-LD) | expired | `valid-but-expired` | `CREDENTIAL_EXPIRED` |
| 5 | SD-JWT VC | off | `valid` | — |
| 6 | SD-JWT VC | bad-signature | `invalid` | `SIGNATURE_INVALID` |
| 7 | SD-JWT VC | claim-corruption | `invalid` | `CLAIM_MISMATCH` |
| 8 | SD-JWT VC | expired | `valid-but-expired` | `CREDENTIAL_EXPIRED` |
| 9 | mDoc / mDL | off | `valid` | — |
| 10 | mDoc / mDL | bad-signature | `invalid` | `SIGNATURE_INVALID` |
| 11 | mDoc / mDL | claim-corruption | `invalid` | `CLAIM_MISMATCH` |
| 12 | mDoc / mDL | expired | `valid-but-expired` | `CREDENTIAL_EXPIRED` |
| 13 | Issuer=`external-mock`, Wallet=Inji Wallet Mobile, Format=W3C VC | off | `invalid` | `DID_METHOD_GAP` |

- [ ] Case 1 &nbsp; - [ ] Case 2 &nbsp; - [ ] Case 3 &nbsp; - [ ] Case 4
- [ ] Case 5 &nbsp; - [ ] Case 6 &nbsp; - [ ] Case 7 &nbsp; - [ ] Case 8
- [ ] Case 9 &nbsp; - [ ] Case 10 &nbsp; - [ ] Case 11 &nbsp; - [ ] Case 12
- [ ] Case 13 (cross-ecosystem)

**\* Row 3 is not a bug.** JSON-LD signs the whole document as one unit, so it can't tell "wrong claim" from "wrong signature" apart — `SIGNATURE_INVALID` is the correct outcome. SD-JWT and mdoc *can* tell them apart (rows 7 and 11) — that's the interesting bit. If either of those two shows `SIGNATURE_INVALID` for claim-corruption instead of `CLAIM_MISMATCH`, that **is** a real regression.

---

## 5. Real Mode matrix

Against the live MOSIP Collab sandbox — a third party's infrastructure we don't control. Read [§8](#8-known-issues--dont-re-file-these) first so you don't chase a known issue.

| Format | Expected behavior |
|---|---|
| W3C VC (JSON-LD) | Real `oauth-details` call succeeds; currently fails at `send-otp` with a clean `FAILED` state + visible error in the inspector (known sandbox bug, §8) — **not** a silent hang or crash |
| mDoc / mDL | Same as above — clean failure, not a crash |
| SD-JWT VC | Rejected **immediately**, no network call made — `FORMAT_MISMATCH`, since no sandbox issuer offers this format. This one should be a clean, fast, deterministic pass. |

- [ ] W3C VC (JSON-LD) fails cleanly
- [ ] mDoc / mDL fails cleanly
- [ ] SD-JWT VC rejects immediately with `FORMAT_MISMATCH`

---

## 6. API spot-checks

Useful to isolate whether an issue is frontend or backend. Backend must be running on port 3000.

```bash
# Config options (drives the Selector)
curl http://localhost:3000/api/config/options

# Start a run
curl -X POST http://localhost:3000/api/flows -H "Content-Type: application/json" \
  -d '{"issuer":"inji-certify","wallet":"inji-wallet-mobile","verifier":"inji-verify","format":"sd-jwt-vc"}'

# Advance it (swap in the flowId from above)
curl -X POST http://localhost:3000/api/flows/<flowId>/advance

# Watch the live event stream (leave running, advance the same flow in another terminal)
curl -N http://localhost:3000/api/flows/<flowId>/events/stream

# Report exports
curl "http://localhost:3000/api/reports/export?format=json"
curl "http://localhost:3000/api/reports/export?format=markdown"
```

- [ ] `GET /api/config/options` lists 3 formats, `sd-jwt-vc` has `realModeSupported: false`
- [ ] `POST /api/flows` returns 201 with a `flowId` and `status: OFFER_CREATED`
- [ ] SSE stream prints `event` and `status` lines as you advance the flow in another terminal
- [ ] Markdown export returns a real table, not an error

---

## 7. Automated suite

Run this before and after any change — it covers the format round-trips (issue → verify → tamper) and one full API integration flow, so most of §4 is already asserted here. Manual testing is for what the suite can't see: the UI itself, and the live sandbox.

```bash
cd backend
npm test
```

- [ ] All 40 tests pass, 0 failures — if this number has changed, someone added or removed a test, not necessarily a problem, just note it

---

## 8. Known issues — don't re-file these

**MOSIP sandbox transaction bug.** Real Mode issuance for `w3c-vc-jsonld` and `mdoc` fails at the `send-otp` step with `invalid_transaction`, 100% reproducibly. This is on MOSIP's side (confirmed across two independent eSignet deployments) — the app's job here is just to fail cleanly, not to succeed. If you see anything *other* than a clean `FAILED` state with a readable error in the Protocol Inspector, that's a real bug worth filing.

**No local Docker stack.** There's no way to run Certify/Wallet/Verify locally on this machine — Real Mode only ever talks to the public MOSIP Collab sandbox. Don't file "can't run offline" as a bug; it's a known scope boundary.

---

## 9. Filing a bug

For anything in §3–§7 that doesn't match, capture:

```
Title:
  <e.g. claim-corruption on mdoc reports SIGNATURE_INVALID instead of CLAIM_MISMATCH>

Steps to reproduce:
  1.
  2.
  3.

Expected:
  <from the matrix in §4/§5>

Actual:
  <what actually happened — paste the Protocol Inspector payload if relevant>

Environment:
  <browser, OS, mode (Simulated/Real), flowId if you have it>
```
