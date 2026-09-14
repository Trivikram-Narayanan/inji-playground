import { Router } from 'express';
import { Orchestrator } from '../services/orchestrator';
import { subscribe } from '../services/eventBus';

const router = Router();

// POST /api/flows - Start a new test run
router.post('/', async (req, res) => {
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
