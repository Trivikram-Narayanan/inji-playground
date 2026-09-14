# Glossary

| Term | Meaning |
|---|---|
| **VC (Verifiable Credential)** | A digital, cryptographically verifiable claim (e.g., a degree, ID) issued by one party and presentable to another. |
| **Issuer** | The system that creates and signs credentials (e.g., Inji Certify). |
| **Wallet / Holder** | The system that stores credentials and presents them on request (e.g., Inji Wallet, Inji Web). |
| **Verifier / Relying Party** | The system that checks a presented credential's validity (e.g., Inji Verify). |
| **OpenID4VCI** | OpenID for Verifiable Credential Issuance — the protocol standard for Issuer → Wallet credential delivery. |
| **OpenID4VP** | OpenID for Verifiable Presentations — the protocol standard for Wallet → Verifier credential presentation. |
| **Credential Offer** | The initial message from Issuer to Wallet describing what credential is available and how to get it. |
| **Token Exchange** | The OAuth2-style exchange of an authorization/pre-auth code for an access token, used before credential issuance. |
| **vp_token** | The token containing the verifiable presentation sent from Wallet to Verifier. |
| **presentation_definition** | The Verifier's declaration of what credential(s)/claims it requires, per OpenID4VP / DIF Presentation Exchange. |
| **W3C VC (JSON-LD)** | Credential format per the W3C Verifiable Credentials Data Model (1.1 / 2.0), often signed with Ed25519Signature2020 or RSA proofs. |
| **SD-JWT VC** | Selective Disclosure JWT — a credential format (IETF) allowing holders to disclose only specific claims. |
| **mDoc / mDL** | Mobile Document / Mobile Driving License format per ISO/IEC 18013-5, used for mobile credentials. |
| **DID (Decentralized Identifier)** | A globally unique identifier not tied to a centralized registry, used to identify issuers/holders/verifiers cryptographically. |
| **Proof Type** | The cryptographic signature scheme used to sign a credential (e.g., Ed25519Signature2020, ES256). |
| **BFF (Backend for Frontend)** | A backend layer tailored to a specific frontend's needs — here, the "Playground BFF" orchestrates calls to Certify/Mimoto/Verify. |
| **Mimoto** | The Java backend service behind Inji Wallet (mobile/web). |
| **Tuvali** | Library used for offline BLE credential transfer in Inji Wallet. |
| **PixelPass** | MOSIP library for QR code encoding/decoding of credentials. |
| **Interoperability** | The ability of independently-built Issuer/Wallet/Verifier implementations to correctly exchange and validate credentials with each other. |
| **Protocol Inspector** | The playground's UI panel showing raw request/response payloads at each protocol step, like a network inspector. |
| **Tamper Mode** | A testing mode that deliberately corrupts a credential/presentation to verify the verifier correctly rejects it. |
| **Interoperability Report** | The structured pass/fail summary generated per test run (issuer, wallet, verifier, format, proof type, outcome, error detail). |
