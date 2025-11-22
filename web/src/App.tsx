import { useEffect, useRef, useState } from 'react';
import { RegistrationForm } from './components/RegistrationForm';
import { OAuthConnect } from './components/OAuthConnect';
import { ConsentStatusCard } from './components/ConsentStatusCard';
import { ChatList } from './components/ChatList';
import { MessageFeed } from './components/MessageFeed';
import type { ChatRecord, MessageRecord, UserProfile } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const EVENTS_URL = API_BASE ? `${API_BASE}/api/events` : '/api/events';

export default function App() {
  const [user, setUser] = useState<UserProfile>();
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>();
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const selectedGroupRef = useRef<string>();

  useEffect(() => {
    refreshChats();
  }, []);

  useEffect(() => {
    selectedGroupRef.current = selectedGroupId;
  }, [selectedGroupId]);

  useEffect(() => {
    const source = new EventSource(EVENTS_URL);

    source.addEventListener('chat-updated', (event) => {
      const chat = JSON.parse((event as MessageEvent).data) as ChatRecord;
      setChats((current) => upsertChat(current, chat));
    });

    source.addEventListener('message-created', (event) => {
      const message = JSON.parse((event as MessageEvent).data) as MessageRecord;
      if (selectedGroupRef.current === message.sharedGroupId) {
        setMessages((current) => upsertMessage(current, message));
      }
    });

    source.onerror = (error) => {
      console.error('SSE connection error', error);
    };

    return () => {
      source.close();
    };
  }, []);

  async function refreshChats() {
    try {
      const response = await fetch(`${API_BASE}/api/chats`);
      if (!response.ok) {
        throw new Error('Unable to fetch chats');
      }
      const payload = (await response.json()) as ChatRecord[];
      setChats(payload);
      if (selectedGroupId) {
        await fetchMessages(selectedGroupId);
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchMessages(groupId: string) {
    try {
      const response = await fetch(`${API_BASE}/api/chats/${encodeURIComponent(groupId)}/messages`);
      if (!response.ok) {
        throw new Error('Unable to fetch messages');
      }
      const payload = (await response.json()) as MessageRecord[];
      setMessages(payload);
    } catch (error) {
      console.error(error);
    }
  }

  function handleSelectChat(groupId: string) {
    setSelectedGroupId(groupId);
    fetchMessages(groupId);
  }

  function handleRegistered(profile: UserProfile) {
    setUser(profile);
    refreshChats();
  }

  function handleUpdated(profile: UserProfile) {
    setUser(profile);
    refreshChats();
  }

  return (
    <div>
      <h1>Kibitz Control Center</h1>
      <p>
        Register, connect integrations, distribute OTPs, and monitor chats. When a group across MMS + other
        platforms has the same members, everyone can approve sharing to merge their timelines.
      </p>
      <RegistrationForm onRegistered={handleRegistered} />
      <ConsentStatusCard user={user} />
      <OAuthConnect user={user} onUpdated={handleUpdated} />
      <ChatList chats={chats} selectedGroupId={selectedGroupId} onSelect={handleSelectChat} />
      <MessageFeed groupId={selectedGroupId} messages={messages} />
      <div className="card">
        <h2>Need to revoke access?</h2>
        <p>
          Inside any chat, simply send <code>revoke</code>. The backend persists consent state, so the command
          works even after restarts.
        </p>
        <p>
          To link identical chats, once everyone has authorized their chat, send <code>share yes</code> from
          each location when prompted.
        </p>
      </div>
    </div>
  );
}

function upsertChat(list: ChatRecord[], next: ChatRecord): ChatRecord[] {
  const existingIndex = list.findIndex((chat) => chat.channel === next.channel);
  if (existingIndex === -1) {
    return [...list, next];
  }

  const clone = [...list];
  clone[existingIndex] = next;
  return clone;
}

function upsertMessage(list: MessageRecord[], next: MessageRecord): MessageRecord[] {
  const existingIndex = list.findIndex((message) => message.id === next.id);
  if (existingIndex === -1) {
    return [...list, next].sort((a, b) => a.postedAt.localeCompare(b.postedAt));
  }

  const clone = [...list];
  clone[existingIndex] = next;
  return clone.sort((a, b) => a.postedAt.localeCompare(b.postedAt));
}
