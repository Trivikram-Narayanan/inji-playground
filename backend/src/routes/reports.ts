import { Router } from 'express';
import { Orchestrator } from '../services/orchestrator';

const router = Router();

// GET /api/reports - Get all reports, optional ?format=&outcome=&issuer= filters
router.get('/', async (req, res) => {
  try {
    const reports = await Orchestrator.getAllReports(req.query as any);
    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/stats - Get report statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Orchestrator.getReportStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reports/export?format=markdown|json - per 10_Report_Templates.md §2
router.get('/export', async (req, res) => {
  try {
    const reports = await Orchestrator.getAllReports({});
    if (req.query.format === 'markdown') {
      const rows = reports
        .map((r: any) => `| ${r.issuer} | ${r.wallet} | ${r.verifier} | ${r.format} | ${r.outcome === 'pass' ? '✅ Pass' : '❌ Fail'} | ${r.error_code || ''} |`)
        .join('\n');
      const markdown = `## Interoperability Matrix — Summary\n\n| Issuer | Wallet | Verifier | Format | Outcome | Notes |\n|---|---|---|---|---|---|\n${rows}\n`;
      res.set('Content-Type', 'text/markdown').send(markdown);
    } else {
      res.json(reports);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
