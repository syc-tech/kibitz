import { MessageRecord } from '../types';

interface Props {
  groupId?: string;
  messages: MessageRecord[];
}

export function MessageFeed({ groupId, messages }: Props) {
  return (
    <div className="card">
      <h2>Shared messages</h2>
      {groupId ? <p>Showing data for shared group <strong>{groupId}</strong>.</p> : <p>Select a chat to view its approved messages.</p>}
      <div className="message-feed">
        {messages.map((message) => (
          <div key={message.id} className="message-card">
            <div>
              <strong>{message.authorId}</strong> — {new Date(message.postedAt).toLocaleString()}
            </div>
            <div>{message.renderedMessage}</div>
            {message.originalMessage !== message.renderedMessage && (
              <small>Original: {message.originalMessage}</small>
            )}
          </div>
        ))}
        {messages.length === 0 && <p>No messages yet.</p>}
      </div>
    </div>
  );
}
