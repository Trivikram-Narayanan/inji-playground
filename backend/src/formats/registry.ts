import type { KeyType } from '../services/crypto';

export type FormatId = 'w3c-vc-jsonld' | 'sd-jwt-vc' | 'mdoc';

export type RealFormatConfig = {
  issuerId: string;
  credentialConfigurationId: string;
  scope: string;
  keyType: KeyType;
  proofSigningAlg: string;
  esignetHost: string;
  issuerHost: string;
  clientId: string;
};

export type FormatDefinition = {
  id: FormatId;
  label: string;
  vcFormat: string;
  /** null when the sandbox has no issuer offering this format in Real Mode. */
  real: RealFormatConfig | null;
};

/**
 * Central registry of what each credential format needs, for both Simulated Mode
 * (which format-specific module to call) and Real Mode (which sandbox issuer to use).
 * Verified against the live MOSIP Collab sandbox: only `Mosip` (ldp_vc) and `MockMdl`
 * (mso_mdoc) exist as real issuers; no sandbox issuer offers SD-JWT VC at all.
 */
export const FORMAT_REGISTRY: Record<FormatId, FormatDefinition> = {
  'w3c-vc-jsonld': {
    id: 'w3c-vc-jsonld',
    label: 'W3C VC (JSON-LD)',
    vcFormat: 'ldp_vc',
    real: {
      issuerId: 'Mosip',
      credentialConfigurationId: 'MOSIPVerifiableCredential',
      scope: 'mosip_identity_vc_ldp',
      keyType: 'EdDSA',
      proofSigningAlg: 'EdDSA',
      esignetHost: 'https://esignet-mosipid.collab.mosip.net/v1/esignet',
      issuerHost: 'https://injicertify-mosipid.collab.mosip.net',
      clientId: 'mpartner-default-mimoto-mosipid-oidc',
    },
  },
  'sd-jwt-vc': {
    id: 'sd-jwt-vc',
    label: 'SD-JWT VC',
    vcFormat: 'dc+sd-jwt',
    real: null, // no sandbox issuer offers this format - Simulated Mode only.
  },
  mdoc: {
    id: 'mdoc',
    label: 'mDoc / mDL',
    vcFormat: 'mso_mdoc',
    real: {
      issuerId: 'MockMdl',
      credentialConfigurationId: 'DrivingLicenseCredential',
      scope: 'sample_vc_mdoc',
      keyType: 'ES256',
      proofSigningAlg: 'ES256',
      esignetHost: 'https://esignet-mock.collab.mosip.net/v1/esignet',
      issuerHost: 'https://injicertify-mdl.collab.mosip.net',
      clientId: 'mpartner-default-mimoto-mdl-oidc',
    },
  },
};

export function getFormat(id: string): FormatDefinition {
  const def = FORMAT_REGISTRY[id as FormatId];
  if (!def) throw new Error(`Unknown format: ${id}`);
  return def;
}
