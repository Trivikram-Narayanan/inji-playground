**Title:** [Interop Gap] eSignet Collab sandbox drops pre-auth transaction between `oauth-details` and `send-otp`

**Summary:**
On the MOSIP Collab sandbox, a `transactionId` returned successfully by eSignet's `POST /v1/esignet/authorization/v3/oauth-details` is rejected as `invalid_transaction` by the very next call, `POST /v1/esignet/authorization/send-otp`, using that same `transactionId`. This happens 100% of the time — not intermittently — across every attempt made, and reproduces identically against two independent eSignet deployments backing two different Certify issuers, which rules out a per-issuer configuration problem. This blocks the entire headless OIDC login flow (and therefore all OpenID4VCI issuance) for any client that isn't the official Inji Wallet/Web app itself.

**Components Involved:**
- Identity/Auth: eSignet (`esignet-mosipid.collab.mosip.net` and `esignet-mock.collab.mosip.net` — both affected)
- Issuer: Inji Certify (`injicertify-mosipid.collab.mosip.net`, `injicertify-farmer.collab.mosip.net` — reproduced against both)
- BFF: Mimoto (`api.collab.mosip.net`) — not implicated; the failure happens before Mimoto is ever called

**Steps to Reproduce:**
1. `POST https://esignet-mosipid.collab.mosip.net/v1/esignet/authorization/v3/oauth-details` with a fresh `nonce`/`state`, `clientId: mpartner-default-mimoto-mosipid-oidc`, `scope: mosip_identity_vc_ldp`, `redirectUri: io.mosip.residentapp.inji://oauthredirect`, PKCE `codeChallenge`/`codeChallengeMethod: S256`, `acrValues: mosip:idp:acr:generated-code`. (Requires an `XSRF-TOKEN` cookie warm-up call first, and the response's `Set-Cookie` header re-sent as both `Cookie` and `X-XSRF-TOKEN` on this and every subsequent call — otherwise the request is rejected with a 403 before this bug is even reached.)
2. Response is `200 OK` with a real `transactionId`, real `credentialScopes`, and real client/config metadata.
3. Immediately (same process, sub-second gap) `POST https://esignet-mosipid.collab.mosip.net/v1/esignet/authorization/send-otp` with that exact `transactionId` and `individualId: 5860356276` (a documented sandbox mock UIN).
4. Response is `200 OK` at the HTTP layer, but the body is `{"response": null, "errors": [{"errorCode": "invalid_transaction", "errorMessage": "invalid_transaction"}]}`.

Repeated 3+ times against `esignet-mosipid.collab.mosip.net` (backing the `Mosip` issuer) and again against `esignet-mock.collab.mosip.net` (backing the `Farmer` issuer) — identical failure both times, every time.

**Expected Behavior:**
`send-otp` recognizes the `transactionId` just issued by `oauth-details` and proceeds to send (or mock-send) an OTP, per the standard eSignet headless-OTP-login sequence (`oauth-details` → `send-otp` → `v2/authenticate` → `auth-code`) that Inji Wallet/Web itself relies on.

**Actual Behavior:**
`send-otp` cannot find the transaction that `oauth-details` just created and reports `invalid_transaction`, unconditionally.

**Relevant Payload / Error:**
```json
// oauth-details response (200, abbreviated)
{
  "response": {
    "transactionId": "RRLFO3DpdFcGpaqTmQpZPBZJD60VDQWGEPRbA8IaCJs",
    "credentialScopes": ["mosip_identity_vc_ldp"]
  },
  "errors": []
}

// send-otp response (200, using the transactionId above, issued <1s later)
{
  "response": null,
  "errors": [
    { "errorCode": "invalid_transaction", "errorMessage": "invalid_transaction" }
  ]
}
```

**Suggested Root Cause (if known):**
Not confirmed, but the symptom (a value written by one request and unreadable by the very next, with no sign of expiry — this isn't a timeout) is consistent with the pre-auth transaction cache not being shared across backend replicas — e.g. an in-memory cache (Caffeine-style) used where a shared cache (Redis) would be needed behind a load balancer with no session affinity, so `oauth-details` and `send-otp` may land on different pods that don't see each other's writes. This is a guess based on the symptom shape, not a confirmed diagnosis — flagging it as a starting point for whoever investigates, not a claimed root cause.

**Environment:**
- Sandbox: MOSIP Collab (`*.collab.mosip.net`), public instance
- Date observed: 2026-09-13/14
- Reproduced against: `esignet-mosipid.collab.mosip.net` (issuer `Mosip`) and `esignet-mock.collab.mosip.net` (issuer `Farmer`)
- Client: headless (non-browser) OpenID4VCI client conforming to the same `oauth-details`/`send-otp`/`v2/authenticate`/`auth-code` sequence Inji Wallet/Web uses
- Related community reports: this may be the same class of issue as reports of general Collab sandbox instability on the MOSIP community forum (e.g. threads on failing to deploy/use inji-certify via the sandbox) — not confirmed to be the same underlying bug, but the symptom family (transactions/state not surviving between calls) is similar.
