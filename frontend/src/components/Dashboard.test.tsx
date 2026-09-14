import { render, screen } from '@testing-library/react';
import axios from 'axios';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Dashboard from './Dashboard';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

const reports = [
  { flow_id: '1', issuer: 'inji-certify', wallet: 'inji-web', verifier: 'inji-verify', format: 'w3c-vc-jsonld', outcome: 'pass', created_at: new Date().toISOString() },
  { flow_id: '2', issuer: 'inji-certify', wallet: 'inji-web', verifier: 'inji-verify', format: 'w3c-vc-jsonld', outcome: 'fail', error_code: 'BAD_SIGNATURE', created_at: new Date().toISOString() },
];

const stats = { totalTests: 2, passed: 1, failed: 1, passRate: 50, mostCommonError: 'BAD_SIGNATURE' };

describe('Dashboard', () => {
  beforeEach(() => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.endsWith('/reports/stats')) return Promise.resolve({ data: stats });
      if (url.endsWith('/reports')) return Promise.resolve({ data: reports });
      return Promise.reject(new Error(`unexpected url ${url}`));
    });
  });

  it('renders aggregate stats and a per-format pass-rate breakdown', async () => {
    render(<Dashboard />);

    expect(await screen.findByText('50%')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate')).toBeInTheDocument();
    expect(screen.getByText('Pass Rate by Format')).toBeInTheDocument();
    expect(screen.getByText('1/2 (50%)')).toBeInTheDocument();

    const progressbar = screen.getByRole('progressbar', { name: /w3c-vc-jsonld pass rate/i });
    expect(progressbar).toHaveAttribute('aria-valuenow', '50');
  });

  it('shows an empty state when there are no reports', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.endsWith('/reports/stats')) return Promise.resolve({ data: { totalTests: 0, passed: 0, failed: 0, passRate: 0, mostCommonError: 'None' } });
      if (url.endsWith('/reports')) return Promise.resolve({ data: [] });
      return Promise.reject(new Error(`unexpected url ${url}`));
    });

    render(<Dashboard />);

    expect(await screen.findByText(/No reports found/i)).toBeInTheDocument();
    expect(screen.queryByText('Pass Rate by Format')).not.toBeInTheDocument();
  });
});
