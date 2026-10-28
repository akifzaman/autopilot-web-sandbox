import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('shows ok when the API health check succeeds', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: 'ok' }) }));
  render(<App />);
  expect(await screen.findByText('API: ok')).toBeInTheDocument();
});

it('shows unreachable when the API health check fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  render(<App />);
  expect(await screen.findByText('API: unreachable')).toBeInTheDocument();
});
