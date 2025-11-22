import { useState } from 'react';
import type { UserProfile } from '../types';

interface RegistrationFormProps {
  onRegistered(user: UserProfile): void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export function RegistrationForm({ onRegistered }: RegistrationFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email })
      });

      if (!response.ok) {
        throw new Error('Unable to register user');
      }

      const payload: UserProfile = await response.json();
      onRegistered(payload);
      setMessage(`User registered. OTP: ${payload.otp}`);
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Create an account</h2>
      <p>Register to receive a one-time password for linking chats to your identity.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={2} />
        </label>
        <label>
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Register'}
        </button>
      </form>
      {message && <div className="status">{message}</div>}
    </div>
  );
}
