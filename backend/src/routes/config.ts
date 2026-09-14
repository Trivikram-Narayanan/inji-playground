import { Router } from 'express';
import { FORMAT_REGISTRY } from '../formats/registry';
import { sandboxConfig } from '../config';

const router = Router();

// GET /api/config/options - per 05_API_Specification.md §3
router.get('/options', (_req, res) => {
  res.json({
    issuers: ['inji-certify', 'external-mock'],
    wallets: ['inji-wallet-mobile', 'inji-web', 'external-mock'],
    verifiers: ['inji-verify', 'external-mock'],
    formats: Object.values(FORMAT_REGISTRY).map((f) => ({
      id: f.id,
      label: f.label,
      realModeSupported: !!f.real,
    })),
    realMode: { mockUin: sandboxConfig.mockUin },
  });
});

export default router;
