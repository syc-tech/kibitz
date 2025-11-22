import type { UserProfile } from '../types';

interface Props {
  user?: UserProfile;
}

export function ConsentStatusCard({ user }: Props) {
  if (!user) {
    return null;
  }

  return (
    <div className="card">
      <h2>Link your chats</h2>
      <p>Share the following command inside any chat where the Kibitz bot is present:</p>
      <pre>
        <code>connect {user.username} {user.otp}</code>
      </pre>
      <p>Prefer to stay anonymous? Reply with <code>yes</code> and Kibitz will parse messages without saving your identity.</p>
      <p className="badge">You can always type <code>revoke</code> to remove access.</p>
    </div>
  );
}
