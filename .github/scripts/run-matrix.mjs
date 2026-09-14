// Cross-platform CI runner for the Inji Interoperability Playground matrix
import fs from 'fs';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';

const MATRIX_CASES = [
  { id: 1, format: 'w3c-vc-jsonld', tamperMode: false, tamperType: null, expResult: 'valid', expErr: null },
  { id: 2, format: 'w3c-vc-jsonld', tamperMode: true, tamperType: 'bad-signature', expResult: 'invalid', expErr: 'SIGNATURE_INVALID' },
  { id: 3, format: 'w3c-vc-jsonld', tamperMode: true, tamperType: 'claim-corruption', expResult: 'invalid', expErr: 'SIGNATURE_INVALID' },
  { id: 4, format: 'w3c-vc-jsonld', tamperMode: true, tamperType: 'expired', expResult: 'valid-but-expired', expErr: 'CREDENTIAL_EXPIRED' },
  { id: 5, format: 'sd-jwt-vc', tamperMode: false, tamperType: null, expResult: 'valid', expErr: null },
  { id: 6, format: 'sd-jwt-vc', tamperMode: true, tamperType: 'bad-signature', expResult: 'invalid', expErr: 'SIGNATURE_INVALID' },
  { id: 7, format: 'sd-jwt-vc', tamperMode: true, tamperType: 'claim-corruption', expResult: 'invalid', expErr: 'CLAIM_MISMATCH' },
  { id: 8, format: 'sd-jwt-vc', tamperMode: true, tamperType: 'expired', expResult: 'valid-but-expired', expErr: 'CREDENTIAL_EXPIRED' },
  { id: 9, format: 'mdoc', tamperMode: false, tamperType: null, expResult: 'valid', expErr: null },
  { id: 10, format: 'mdoc', tamperMode: true, tamperType: 'bad-signature', expResult: 'invalid', expErr: 'SIGNATURE_INVALID' },
  { id: 11, format: 'mdoc', tamperMode: true, tamperType: 'claim-corruption', expResult: 'invalid', expErr: 'CLAIM_MISMATCH' },
  { id: 12, format: 'mdoc', tamperMode: true, tamperType: 'expired', expResult: 'valid-but-expired', expErr: 'CREDENTIAL_EXPIRED' },
  { id: 13, issuer: 'external-mock', wallet: 'inji-wallet-mobile', verifier: 'inji-verify', format: 'w3c-vc-jsonld', tamperMode: false, tamperType: null, expResult: 'invalid', expErr: 'DID_METHOD_GAP' },
];

async function run() {
  console.log('Starting Inji Interoperability Matrix CI Runner...');
  console.log(`Connecting to: ${API_BASE}`);

  let allPassed = true;
  const results = [];

  for (const c of MATRIX_CASES) {
    const payload = {
      issuer: c.issuer || 'inji-certify',
      wallet: c.wallet || 'inji-wallet-mobile',
      verifier: c.verifier || 'inji-verify',
      format: c.format,
      tamperMode: c.tamperMode,
      tamperType: c.tamperType,
    };

    try {
      const startRes = await fetch(`${API_BASE}/flows`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const startData = await startRes.json();
      const flowId = startData.flowId;

      const advRes = await fetch(`${API_BASE}/flows/${flowId}/advance`, { method: 'POST' });
      const advData = await advRes.json();

      const repRes = await fetch(`${API_BASE}/flows/${flowId}/report`);
      const repData = await repRes.json();

      const passResult = advData.result === c.expResult;
      const passErr =
        (!c.expErr && (!repData.error_code || repData.error_code === '')) ||
        repData.error_code === c.expErr;

      const passed = passResult && passErr;
      if (!passed) allPassed = false;

      results.push({
        id: c.id,
        format: c.format,
        tamper: c.tamperType || 'none',
        expected: `${c.expResult} (${c.expErr || 'no-error'})`,
        actual: `${advData.result} (${repData.error_code || 'no-error'})`,
        status: passed ? 'PASS' : 'FAIL',
      });

      console.log(`Case ${c.id}: [${c.format}] [tamper: ${c.tamperType || 'none'}] -> ${passed ? '✓ PASS' : '✗ FAIL'}`);
    } catch (err) {
      allPassed = false;
      console.error(`Case ${c.id} execution failed:`, err);
      results.push({
        id: c.id,
        format: c.format,
        tamper: c.tamperType || 'none',
        expected: `${c.expResult} (${c.expErr || 'no-error'})`,
        actual: `ERROR: ${err.message}`,
        status: 'FAIL',
      });
    }
  }

  // Fetch matrix markdown
  let matrixMarkdown = '';
  try {
    const mdRes = await fetch(`${API_BASE}/reports/export?format=markdown`);
    matrixMarkdown = await mdRes.text();
  } catch (err) {
    matrixMarkdown = 'Failed to fetch markdown export.';
  }

  const summary = [
    '# 🛡️ Inji Interoperability Matrix Test Results',
    '',
    `**Overall CI Status**: ${allPassed ? '✅ ALL 13 TEST CASES PASSED' : '❌ FAILURES DETECTED'}`,
    '',
    '| # | Format | Tamper | Expected | Actual | Status |',
    '|---|---|---|---|---|---|',
    ...results.map((r) => `| ${r.id} | ${r.format} | ${r.tamper} | ${r.expected} | ${r.actual} | ${r.status === 'PASS' ? '✅ Pass' : '❌ Fail'} |`),
    '',
    '---',
    '',
    matrixMarkdown,
  ].join('\n');

  fs.writeFileSync('matrix-summary.md', summary, 'utf8');
  console.log('\nResults written to matrix-summary.md');

  if (!allPassed) {
    console.error('Matrix test runner failed with one or more mismatches.');
    process.exit(1);
  } else {
    console.log('All interoperability matrix cases completed successfully.');
  }
}

run().catch((err) => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
