import { ChatRecord } from '../types';

interface Props {
  chats: ChatRecord[];
  selectedGroupId?: string;
  onSelect(groupId: string): void;
}

export function ChatList({ chats, selectedGroupId, onSelect }: Props) {
  return (
    <div className="card">
      <h2>Chats</h2>
      <p>Each chat shows its participants and linking status. Select one to view shared messages.</p>
      {chats.length === 0 && <p>No chats available yet.</p>}
      {chats.map((chat) => (
        <div
          key={chat.channel}
          className={`chat-row ${selectedGroupId === chat.sharedGroupId ? 'active' : ''}`}
          onClick={() => onSelect(chat.sharedGroupId)}
        >
          <div>
            <strong>{chat.channel}</strong>
            <div className="badge">Shared group: {chat.sharedGroupId}</div>
          </div>
          <div>
            Participants:
            <ul>
              {chat.participants.map((participant) => (
                <li key={participant.key}>
                  {participant.username ?? participant.authorId} — {participant.consentType}
                </li>
              ))}
            </ul>
          </div>
          {chat.pendingLinkGroupId && (
            <p className="status">
              Link pending with {chat.pendingLinkTargetId}. Ask members to send "share yes" inside their chats to merge data.
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
