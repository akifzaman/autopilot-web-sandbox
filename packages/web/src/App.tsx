import { useEffect, useState } from 'react';

type ApiStatus = 'checking' | 'ok' | 'unreachable';

export function App() {
  const [status, setStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((body: { status?: string }) => setStatus(body.status === 'ok' ? 'ok' : 'unreachable'))
      .catch(() => setStatus('unreachable'));
  }, []);

  return (
    <main>
      <h1>Autopilot Web Sandbox</h1>
      <p data-testid="api-status">API: {status}</p>
    </main>
  );
}
