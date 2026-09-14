import { render, screen, fireEvent } from '@testing-library/react';
import axios from 'axios';
import { vi, describe, it, expect } from 'vitest';
import Selector from './Selector';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

describe('Selector', () => {
  it('falls back to default options when the BFF config endpoint is unreachable', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network error'));
    render(<Selector onRunTest={vi.fn()} />);

    expect(await screen.findByText('Inji Certify')).toBeInTheDocument();
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBeGreaterThan(0);
  });

  it('calls onRunTest with the selected config', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network error'));
    const onRunTest = vi.fn();
    render(<Selector onRunTest={onRunTest} />);

    await screen.findByText('Inji Certify');
    fireEvent.click(screen.getByRole('button', { name: /run test/i }));

    expect(onRunTest).toHaveBeenCalledTimes(1);
    expect(onRunTest).toHaveBeenCalledWith(
      expect.objectContaining({ issuer: 'inji-certify', wallet: 'inji-wallet-mobile', verifier: 'inji-verify', format: 'w3c-vc-jsonld' })
    );
  });

  it('toggles Real Mode via its accessible checkbox', async () => {
    mockedAxios.get.mockRejectedValue(new Error('network error'));
    render(<Selector onRunTest={vi.fn()} />);

    await screen.findByText('Inji Certify');
    const toggle = screen.getByLabelText('Toggle Real Mode') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    fireEvent.click(toggle);
    expect(toggle.checked).toBe(true);
  });
});
