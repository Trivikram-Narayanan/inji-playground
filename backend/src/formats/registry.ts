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
  /** null when no issuer (sandbox or self-hosted) is configured for this format in Real Mode. */
  real: RealFormatConfig | null;
};

/**
 * Builds a format's Real Mode config from `REAL_<PREFIX>_*` env vars, falling back to the
 * given sandbox default for any var that isn't set. Set `REAL_<PREFIX>_ENABLED=false` to force
 * a format off in Real Mode even when defaults exist (e.g. to limit a deployment to formats
 * your own Certify instance actually issues). When there is no sandbox default (`fallback:
 * null`, e.g. SD-JWT today), the format stays disabled until every required var is supplied -
 * self-hosters running their own SD-JWT-capable Certify can enable it this way without a code
 * change.
 */
function resolveRealConfig(envPrefix: string, fallback: RealFormatConfig | null): RealFormatConfig | null {
  const env = (name: string) => process.env[`REAL_${envPrefix}_${name}`];

  if (env('ENABLED')?.toLowerCase() === 'false') return null;

  const issuerId = env('ISSUER_ID') ?? fallback?.issuerId;
  const credentialConfigurationId = env('CREDENTIAL_CONFIG_ID') ?? fallback?.credentialConfigurationId;
  const scope = env('SCOPE') ?? fallback?.scope;
  const keyType = (env('KEY_TYPE') as KeyType | undefined) ?? fallback?.keyType;
  const esignetHost = env('ESIGNET_HOST') ?? fallback?.esignetHost;
  const issuerHost = env('ISSUER_HOST') ?? fallback?.issuerHost;
  const clientId = env('CLIENT_ID') ?? fallback?.clientId;

  if (!issuerId || !credentialConfigurationId || !scope || !keyType || !esignetHost || !issuerHost || !clientId) {
    return null; // incompletely configured - stay disabled rather than half-work
  }
  const proofSigningAlg = env('PROOF_SIGNING_ALG') ?? fallback?.proofSigningAlg ?? keyType;

  return { issuerId, credentialConfigurationId, scope, keyType, proofSigningAlg, esignetHost, issuerHost, clientId };
}

/**
 * Central registry of what each credential format needs, for both Simulated Mode
 * (which format-specific module to call) and Real Mode (which issuer to use).
 *
 * Defaults below point at the live MOSIP Collab sandbox, verified directly: only `Mosip`
 * (ldp_vc) and `MockMdl` (mso_mdoc) exist as real sandbox issuers; no sandbox issuer offers
 * SD-JWT VC. Running against your own Certify/eSignet/Mimoto instead of the sandbox - or
 * adding real SD-JWT support - needs no code change: set the matching `REAL_<PREFIX>_*` env
 * vars (see `.env.example`) and this registry picks them up automatically.
 */
export const FORMAT_REGISTRY: Record<FormatId, FormatDefinition> = {
  'w3c-vc-jsonld': {
    id: 'w3c-vc-jsonld',
    label: 'W3C VC (JSON-LD)',
    vcFormat: 'ldp_vc',
    real: resolveRealConfig('JSONLD', {
      issuerId: 'Mosip',
      credentialConfigurationId: 'MOSIPVerifiableCredential',
      scope: 'mosip_identity_vc_ldp',
      keyType: 'EdDSA',
      proofSigningAlg: 'EdDSA',
      esignetHost: 'https://esignet-mosipid.collab.mosip.net/v1/esignet',
      issuerHost: 'https://injicertify-mosipid.collab.mosip.net',
      clientId: 'mpartner-default-mimoto-mosipid-oidc',
    }),
  },
  'sd-jwt-vc': {
    id: 'sd-jwt-vc',
    label: 'SD-JWT VC',
    vcFormat: 'dc+sd-jwt',
    real: resolveRealConfig('SDJWT', null), // no sandbox issuer - stays disabled unless self-hosted
  },
  mdoc: {
    id: 'mdoc',
    label: 'mDoc / mDL',
    vcFormat: 'mso_mdoc',
    real: resolveRealConfig('MDOC', {
      issuerId: 'MockMdl',
      credentialConfigurationId: 'DrivingLicenseCredential',
      scope: 'sample_vc_mdoc',
      keyType: 'ES256',
      proofSigningAlg: 'ES256',
      esignetHost: 'https://esignet-mock.collab.mosip.net/v1/esignet',
      issuerHost: 'https://injicertify-mdl.collab.mosip.net',
      clientId: 'mpartner-default-mimoto-mdl-oidc',
    }),
  },
};

export function getFormat(id: string): FormatDefinition {
  const def = FORMAT_REGISTRY[id as FormatId];
  if (!def) throw new Error(`Unknown format: ${id}`);
  return def;
}
