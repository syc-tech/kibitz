import { useState } from 'react';
import type { UserProfile } from '../types';
import { API_BASE } from '../config';

interface OAuthConnectProps {
  user?: UserProfile;
  onUpdated(user: UserProfile): void;
}

const SERVICES = ['slack', 'discord', 'sms', 'email'];
export function OAuthConnect({ user, onUpdated }: OAuthConnectProps) {
  const [service, setService] = useState(SERVICES[0]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="card">
        <h2>Connect services</h2>
        <p>Register first so we know which account to link.</p>
      </div>
    );
  }

  const currentUser: UserProfile = user;

  async function handleConnect(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/users/${encodeURIComponent(currentUser.username)}/oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceName: service })
      });

      if (!response.ok) {
        throw new Error('Unable to connect service');
      }

      const payload = (await response.json()) as UserProfile;
      onUpdated(payload);
      setMessage(`Connected to ${service}. Chats can now sync with this integration.`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Connect services</h2>
      <p>Authorize Kibitz to act on your behalf for each integration.</p>
      <form onSubmit={handleConnect}>
        <label>
          Choose service
          <select value={service} onChange={(event) => setService(event.target.value)}>
            {SERVICES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Connecting…' : 'Connect service'}
        </button>
      </form>
      <div className="service-list">
        {currentUser.services.map((svc) => (
          <span className="service-pill" key={svc.name}>
            {svc.name} · {new Date(svc.connectedAt).toLocaleDateString()}
          </span>
        ))}
      </div>
      {message && <div className="status">{message}</div>}
    </div>
  );
}
