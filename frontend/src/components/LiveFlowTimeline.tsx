import React, { useMemo } from 'react';
import type { FlowEvent, FlowStatus } from '../types/flow';
import { CredentialObject } from './CredentialObject';
import { TrustBoundary } from './TrustBoundary';

interface LiveFlowTimelineProps {
  flowStatus: FlowStatus;
  events: FlowEvent[];
  format?: string;
}

export const TERMINAL_STATUSES = [
  'VERIFIED_VALID',
  'VERIFIED_INVALID',
  'VERIFIED_EXPIRED',
  'FAILED',
] as const;

/**
 * Sections 17 & 18: Act I (Issuance) and Act II (Transit).
 * Places the 3D Credential Object as the protagonist of the exchange.
 * Protocol events appear around it as restrained technical annotations.
 */
export const LiveFlowTimeline: React.FC<LiveFlowTimelineProps> = ({
  flowStatus,
  events,
  format = 'w3c-vc-jsonld',
}) => {
  // Map real SSE event step identifiers to 3D Credential states (Section 06 requirement)
  const credentialState = useMemo(() => {
    if (
      flowStatus.status === 'VERIFIED_VALID' ||
      flowStatus.result === 'valid'
    ) {
      return 'verified';
    }
    if (
      flowStatus.status === 'VERIFIED_INVALID' ||
      flowStatus.status === 'VERIFIED_EXPIRED' ||
      flowStatus.status === 'FAILED' ||
      flowStatus.result === 'invalid' ||
      flowStatus.result === 'valid-but-expired'
    ) {
      return 'rejected';
    }

    const lastEvent = events[events.length - 1];
    if (!lastEvent) return 'blank';

    if (
      lastEvent.step === 'credential_offer' ||
      lastEvent.step === 'token_exchange' ||
      lastEvent.step === 'credential_issued'
    ) {
      return 'sealed';
    }

    if (
      lastEvent.step === 'authorization_request' ||
      lastEvent.step === 'presentation'
    ) {
      return 'transit';
    }

    return 'pending';
  }, [flowStatus, events]);

  const hasEnteredTransit = events.some(
    (e) => e.step === 'authorization_request' || e.step === 'presentation'
  );

  return (
    <div className="w-full flex flex-col gap-12 max-w-6xl mx-auto px-6 py-8">
      {/* Narrative Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-line pb-6 gap-4">
        <div>
          <span className="font-mono text-[10px] text-sealGold uppercase tracking-widest block mb-1">
            PROTOCOL LIFECYCLE // LIVE EXECUTION
          </span>
          <h2 className="font-display text-3xl font-light text-ink">
            {hasEnteredTransit ? 'Act II — Transit Across Domain' : 'Act I — Cryptographic Issuance'}
          </h2>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs text-inkDim">
          <span>FLOW ID: {flowStatus.id.slice(0, 8)}...</span>
          <span className="text-sealGold">STATE: {credentialState.toUpperCase()}</span>
        </div>
      </div>

      {/* Hero Spatial Stage: 3D Credential as Visual Protagonist */}
      <div className="relative w-full h-[420px] bg-panel/30 border border-line flex items-center justify-center overflow-hidden">
        {/* Subtle Spatial Coordinate Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-line" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-line" />
        </div>

        {/* 3D Credential Scene */}
        <CredentialObject state={credentialState} format={format} className="w-full h-full" />

        {/* Floating Protocol Metadata Annotations */}
        <div className="absolute top-4 left-4 font-mono text-[10px] text-inkDim flex flex-col gap-1 pointer-events-none">
          <span>SPEC: OPENID4VCI DRAFT 13</span>
          <span>FORMAT: {format.toUpperCase()}</span>
          <span>PROOF: ED25519-SIGNATURE</span>
        </div>

        <div className="absolute bottom-4 right-4 font-mono text-[10px] text-inkDim text-right pointer-events-none">
          <span>LIFECYCLE STATUS:</span>
          <span className="text-ink font-semibold block">{flowStatus.status}</span>
        </div>
      </div>

      {/* Act II Spatial Trust Boundary */}
      {hasEnteredTransit && (
        <TrustBoundary
          labelLeft="ISSUER AUTHORITY (MOSIP)"
          labelRight="RELYING PARTY (VERIFIER)"
          format={format}
        />
      )}

      {/* Chronological Protocol Event Ledger */}
      <div className="flex flex-col gap-3">
        <span className="font-mono text-xs text-inkDim uppercase tracking-widest">
          EXCHANGE SEQUENCE ({events.length} STEPS COMPLETED)
        </span>

        <div className="border border-line divide-y divide-line/60 bg-panel/30">
          {events.map((evt, idx) => (
            <div
              key={evt.id || idx}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-panelLit/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-sealGold w-6">0{idx + 1}</span>
                <div>
                  <span className="font-mono text-sm text-ink font-medium block">
                    {evt.step}
                  </span>
                  <span className="font-ui text-xs text-inkDim">
                    Actor: <span className="text-ink/80">{evt.actor}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="text-inkDim">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] uppercase font-mono ${
                    evt.status === 'success'
                      ? 'text-verified bg-verified/10'
                      : evt.status === 'error'
                      ? 'text-rejected bg-rejected/10'
                      : 'text-pending bg-pending/10'
                  }`}
                >
                  {evt.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
