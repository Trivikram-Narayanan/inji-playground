/**
 * Declarative ecosystem/trust-matrix model for cross-ecosystem interoperability testing.
 *
 * Each playground actor (issuer/wallet/verifier) belongs to an "ecosystem" - a profile
 * describing which DID method it issues credentials with, and which DID methods it trusts
 * from a counterparty. Simulated Mode's w3c-vc-jsonld path issues with the DID method its
 * ecosystem declares (see `formats/ldpVc.ts`'s `didMethod` param); the orchestrator then asks
 * `checkDidMethodTrust` whether the verifier's ecosystem would actually accept a credential
 * from the issuer's ecosystem, instead of hardcoding one specific issuer/wallet/format triple
 * as the only "cross-ecosystem" scenario. Adding a third ecosystem is a registry entry, not a
 * new branch in the orchestrator - this is what makes the compatibility-testing approach
 * generalize beyond a single (MOSIP) ecosystem.
 */

export type DidMethod = 'did:key' | 'did:jwk';
export type EcosystemId = 'mosip' | 'reference';

export type EcosystemProfile = {
  id: EcosystemId;
  label: string;
  /** DID method this ecosystem's issuer signs credentials with, in Simulated Mode. */
  issuerDidMethod: DidMethod;
  /** DID methods this ecosystem's verifier/wallet will accept an issuer DID from. */
  trustedIssuerDidMethods: DidMethod[];
};

export const ECOSYSTEM_REGISTRY: Record<EcosystemId, EcosystemProfile> = {
  mosip: {
    id: 'mosip',
    label: 'MOSIP / Inji',
    issuerDidMethod: 'did:key',
    trustedIssuerDidMethods: ['did:key'],
  },
  reference: {
    id: 'reference',
    label: 'Generic OpenID4VC Reference',
    issuerDidMethod: 'did:jwk',
    trustedIssuerDidMethods: ['did:jwk'],
  },
};

const ACTOR_ECOSYSTEM: Record<string, EcosystemId> = {
  'inji-certify': 'mosip',
  'inji-wallet-mobile': 'mosip',
  'inji-web': 'mosip',
  'inji-verify': 'mosip',
  'external-mock': 'reference',
};

/** Actors this registry doesn't recognize default to `mosip`, matching this playground's origin ecosystem. */
export function getEcosystem(actorId: string): EcosystemProfile {
  const id = ACTOR_ECOSYSTEM[actorId] ?? 'mosip';
  return ECOSYSTEM_REGISTRY[id];
}

export type DidTrustResult = {
  trusted: boolean;
  issuerEcosystem: EcosystemProfile;
  verifierEcosystem: EcosystemProfile;
};

/** Would `verifierActor`'s ecosystem accept a credential DID-issued by `issuerActor`'s ecosystem? */
export function checkDidMethodTrust(issuerActor: string, verifierActor: string): DidTrustResult {
  const issuerEcosystem = getEcosystem(issuerActor);
  const verifierEcosystem = getEcosystem(verifierActor);
  return {
    trusted: verifierEcosystem.trustedIssuerDidMethods.includes(issuerEcosystem.issuerDidMethod),
    issuerEcosystem,
    verifierEcosystem,
  };
}
