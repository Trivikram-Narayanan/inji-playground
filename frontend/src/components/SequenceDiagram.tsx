import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { type FlowStatus, type FlowEvent } from './LiveFlowTimeline';

interface SequenceDiagramProps {
  flow: FlowStatus | null;
  onEventClick: (event: FlowEvent) => void;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    darkMode: true,
    background: '#08090C',
    primaryColor: '#5B7FFF',
    primaryTextColor: '#EDEFF3',
    primaryBorderColor: '#5B7FFF',
    lineColor: '#242A33',
    secondaryColor: '#101318',
    tertiaryColor: '#171B22',
    actorBorder: '#5B7FFF',
    actorBkg: '#101318',
    actorTextColor: '#EDEFF3',
    actorLineColor: '#5B7FFF',
    signalColor: '#C9A24B',
    signalTextColor: '#EDEFF3',
  },
  securityLevel: 'loose',
});

const STEPS_META = [
  { id: 'credential_offer', from: 'Issuer', to: 'Wallet', label: '1. Credential Offer (OpenID4VCI)' },
  { id: 'token_exchange', from: 'Wallet', to: 'Issuer', label: '2. Token Request & Exchange' },
  { id: 'credential_issued', from: 'Issuer', to: 'Wallet', label: '3. Signed VC Issued' },
  { id: 'authorization_request', from: 'Verifier', to: 'Wallet', label: '4. Auth Request (OpenID4VP)' },
  { id: 'presentation', from: 'Wallet', to: 'Verifier', label: '5. VP Token Presented' },
  { id: 'verification_result', from: 'Verifier', to: 'Wallet', label: '6. Verification Result' },
];

export const SequenceDiagram: React.FC<SequenceDiagramProps> = ({ flow, onEventClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);

  const completedStepIds = flow?.events?.filter((e) => e.status === 'success').map((e) => e.step) || [];
  const latestEventStep = flow?.events?.[flow.events.length - 1]?.step;

  useEffect(() => {
    let isMounted = true;

    const generateDiagram = async () => {
      try {
        setRenderError(null);
        const issuerName = flow ? 'Issuer (Inji Certify)' : 'Issuer';
        const walletName = flow ? 'Wallet (Inji Mobile/Web)' : 'Wallet';
        const verifierName = flow ? 'Verifier (Inji Verify)' : 'Verifier';

        const lines = [
          'sequenceDiagram',
          'autonumber',
          `actor I as ${issuerName}`,
          `actor W as ${walletName}`,
          `actor V as ${verifierName}`,
        ];

        // Step 1: Credential Offer
        if (completedStepIds.includes('credential_offer')) {
          lines.push('I->>+W: Credential Offer (OpenID4VCI Draft 13)');
          lines.push('Note over W: Discovered Offer via QR / Deep-link');
        } else {
          lines.push('I-->>W: [Pending] Credential Offer');
        }

        // Step 2: Token Exchange
        if (completedStepIds.includes('token_exchange')) {
          lines.push('W->>+I: POST /token (Pre-Auth Code grant)');
          lines.push('I-->>-W: Access Token returned');
        } else {
          lines.push('W-->>I: [Pending] Token Exchange');
        }

        // Step 3: Credential Issued
        if (completedStepIds.includes('credential_issued')) {
          lines.push('W->>+I: POST /credential (Proof + Format params)');
          lines.push('I-->>-W: Issued Credential (W3C/SD-JWT/mDoc)');
          lines.push('Note over W: Cryptographic VC Stored in Wallet');
        } else {
          lines.push('I-->>W: [Pending] Credential Issuance');
        }

        // Step 4: Presentation Requested
        if (completedStepIds.includes('authorization_request')) {
          lines.push('V->>+W: Auth Request (OpenID4VP Presentation Definition)');
          lines.push('Note over W: User approves disclosure claims');
        } else {
          lines.push('V-->>W: [Pending] Auth Request (OpenID4VP)');
        }

        // Step 5: Presentation
        if (completedStepIds.includes('presentation')) {
          lines.push('W->>+V: POST /presentation (vp_token submission)');
        } else {
          lines.push('W-->>V: [Pending] VP Token Presentation');
        }

        // Step 6: Verification Result
        if (completedStepIds.includes('verification_result')) {
          const outcome = flow?.result === 'valid' ? '✅ Valid' : flow?.result === 'valid-but-expired' ? '⚠️ Valid but Expired' : '❌ Invalid';
          lines.push(`V-->>-W: Verification Result: ${outcome}`);
          lines.push(`Note over V: Cryptographic Signature & Claim verification complete`);
        } else {
          lines.push('V-->>W: [Pending] Verification Outcome');
        }

        const definition = lines.join('\n');
        const id = `mermaid-seq-${Date.now()}`;
        const { svg } = await mermaid.render(id, definition);

        if (isMounted) {
          setSvgContent(svg);
        }
      } catch (err: any) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setRenderError('Could not render sequence diagram.');
        }
      }
    };

    generateDiagram();

    return () => {
      isMounted = false;
    };
  }, [flow, completedStepIds.length, latestEventStep]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Quick Step Buttons for Inspection */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-inkDim self-center font-mono text-[11px] uppercase mr-1">Inspect Step:</span>
        {STEPS_META.map((step) => {
          const ev = flow?.events?.find((e) => e.step === step.id);
          const isDone = completedStepIds.includes(step.id);
          return (
            <button
              key={step.id}
              disabled={!ev}
              onClick={() => ev && onEventClick(ev)}
              className={`px-3 py-1.5 rounded-lg border font-mono text-xs transition-all ${
                ev
                  ? 'bg-panelLit text-ink border-line hover:bg-panel hover:border-ink/40 cursor-pointer'
                  : 'bg-panelLit/40 text-inkDim/40 border-line cursor-not-allowed'
              } ${isDone ? 'ring-1 ring-verified/30 text-ink' : ''}`}
            >
              {step.label} {isDone ? <span className="text-verified font-bold ml-0.5">✓</span> : ''}
            </button>
          );
        })}
      </div>

      {/* SVG Diagram Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-void border border-line rounded-xl p-5 flex items-center justify-center min-h-[350px] shadow-inner"
      >
        {renderError ? (
          <p className="text-xs font-mono text-rejected">{renderError}</p>
        ) : svgContent ? (
          <div
            className="w-full max-w-full flex justify-center [&_svg]:max-w-full [&_svg]:h-auto transition-opacity duration-300"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        ) : (
          <p className="text-xs font-mono text-inkDim animate-pulse">Rendering sequence diagram...</p>
        )}
      </div>
    </div>
  );
};

export default SequenceDiagram;
