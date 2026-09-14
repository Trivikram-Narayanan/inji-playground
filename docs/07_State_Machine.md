# State Machine Document — Test Run Lifecycle

## 1. States

| State | Meaning |
|---|---|
| `CREATED` | FlowConfig submitted, TestRun record created. |
| `OFFER_CREATED` | Issuer has generated a credential offer. |
| `TOKEN_EXCHANGED` | Wallet has exchanged auth/pre-auth code for access token. |
| `CREDENTIAL_ISSUED` | Wallet has received and stored the credential. |
| `AUTH_REQUESTED` | Verifier has issued an authorization request / presentation_definition. |
| `PRESENTED` | Wallet has sent the vp_token to the Verifier. |
| `VERIFIED_VALID` | Verifier confirms the credential is valid. |
| `VERIFIED_INVALID` | Verifier rejects the credential (signature, format, tamper, etc.). |
| `VERIFIED_EXPIRED` | Verifier confirms the credential is valid but expired. |
| `FAILED` | Any step errored out before completion (timeout, network error, unsupported format, etc.). |

## 2. Transitions

```
CREATED
   │
   ▼
OFFER_CREATED ──(error)──> FAILED
   │
   ▼
TOKEN_EXCHANGED ──(error)──> FAILED
   │
   ▼
CREDENTIAL_ISSUED ──(error)──> FAILED
   │
   ▼
AUTH_REQUESTED ──(error)──> FAILED
   │
   ▼
PRESENTED ──(error)──> FAILED
   │
   ├──> VERIFIED_VALID
   ├──> VERIFIED_INVALID
   └──> VERIFIED_EXPIRED
```

## 3. Terminal States
`VERIFIED_VALID`, `VERIFIED_INVALID`, `VERIFIED_EXPIRED`, and `FAILED` are terminal — a `Report` is generated from whichever terminal state is reached, with `outcome = pass` only for `VERIFIED_VALID` (all others map to `outcome = fail` with an appropriate `errorCode`, except `VERIFIED_EXPIRED` which may be treated as a distinct informational outcome depending on report design).

## 4. Tamper Mode Variant
When `tamperMode = true`, the corruption is injected between `PRESENTED` and the Verifier's processing step. The expected terminal state is `VERIFIED_INVALID` — reaching `VERIFIED_VALID` in tamper mode indicates a bug in the Verifier's negative-path handling and should be flagged prominently in the UI and report.

## 5. Timeout Handling
Each state should have a configurable timeout (e.g., 30s per step). If exceeded, transition to `FAILED` with `errorCode = TIMEOUT` and record which state it was stuck in, for debugging.
