import { Router } from 'express';
import { Orchestrator } from '../services/orchestrator';
import { subscribe } from '../services/eventBus';
import { FORMAT_REGISTRY } from '../formats/registry';

const router = Router();

const KNOWN_ACTORS = ['inji-certify', 'external-mock', 'inji-wallet-mobile', 'inji-web', 'inji-verify'];
const KNOWN_TAMPER_TYPES = ['claim-corruption', 'bad-signature', 'expired'];

function validateStartFlowBody(body: any): string | null {
  if (typeof body !== 'object' || body === null) return 'Request body must be a JSON object';
  for (const field of ['issuer', 'wallet', 'verifier', 'format'] as const) {
    if (typeof body[field] !== 'string' || body[field].trim() === '') {
      return `"${field}" is required and must be a non-empty string`;
    }
  }
  if (!KNOWN_ACTORS.includes(body.issuer)) return `Unknown issuer "${body.issuer}"`;
  if (!KNOWN_ACTORS.includes(body.wallet)) return `Unknown wallet "${body.wallet}"`;
  if (!KNOWN_ACTORS.includes(body.verifier)) return `Unknown verifier "${body.verifier}"`;
  if (!(body.format in FORMAT_REGISTRY)) return `Unknown format "${body.format}"`;
  if (body.mode !== undefined && !['real', 'simulated'].includes(body.mode)) {
    return `"mode" must be "real" or "simulated"`;
  }
  if (body.tamperMode !== undefined && typeof body.tamperMode !== 'boolean') {
    return `"tamperMode" must be a boolean`;
  }
  if (body.tamperMode && body.tamperType !== undefined && !KNOWN_TAMPER_TYPES.includes(body.tamperType)) {
    return `Unknown tamperType "${body.tamperType}"`;
  }
  return null;
}

// POST /api/flows - Start a new test run
router.post('/', async (req, res) => {
  const validationError = validateStartFlowBody(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError, errorCode: 'INVALID_REQUEST' });
  }
  try {
    const result = await Orchestrator.startFlow(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    res.status(502).json({ error: error.message, flowId: error.flowId || null, errorCode: error.errorCode || 'UNKNOWN_ERROR' });
  }
});

// GET /api/flows/:id - Get flow status
router.get('/:id', async (req, res) => {
  try {
    const flow = await Orchestrator.getFlowStatus(req.params.id);
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json(flow);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/flows/:id/events - Get events for a flow
router.get('/:id/events', async (req, res) => {
  try {
    const events = await Orchestrator.getFlowEvents(req.params.id);
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/flows/:id/events/stream - SSE live event stream, per 05_API_Specification.md §1
router.get('/:id/events/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write(': connected\n\n');

  const unsubscribe = subscribe(req.params.id, (update) => {
    res.write(`data: ${JSON.stringify(update)}\n\n`);
  });

  req.on('close', unsubscribe);
});

// POST /api/flows/:id/advance - Advance a flow (presentation + verification)
router.post('/:id/advance', async (req, res) => {
  try {
    const result = await Orchestrator.advanceFlow(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/flows/:id/report - Get report for a flow
router.get('/:id/report', async (req, res) => {
  try {
    const report = await Orchestrator.getFlowReport(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
