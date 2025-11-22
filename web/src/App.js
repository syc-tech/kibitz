import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { RegistrationForm } from './components/RegistrationForm';
import { OAuthConnect } from './components/OAuthConnect';
import { ConsentStatusCard } from './components/ConsentStatusCard';
import { ChatList } from './components/ChatList';
import { MessageFeed } from './components/MessageFeed';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const EVENTS_URL = API_BASE ? `${API_BASE}/api/events` : '/api/events';
export default function App() {
    const [user, setUser] = useState();
    const [chats, setChats] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState();
    const [messages, setMessages] = useState([]);
    const selectedGroupRef = useRef();
    useEffect(() => {
        refreshChats();
    }, []);
    useEffect(() => {
        selectedGroupRef.current = selectedGroupId;
    }, [selectedGroupId]);
    useEffect(() => {
        const source = new EventSource(EVENTS_URL);
        source.addEventListener('chat-updated', (event) => {
            const chat = JSON.parse(event.data);
            setChats((current) => upsertChat(current, chat));
        });
        source.addEventListener('message-created', (event) => {
            const message = JSON.parse(event.data);
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
            const payload = (await response.json());
            setChats(payload);
            if (selectedGroupId) {
                await fetchMessages(selectedGroupId);
            }
        }
        catch (error) {
            console.error(error);
        }
    }
    async function fetchMessages(groupId) {
        try {
            const response = await fetch(`${API_BASE}/api/chats/${encodeURIComponent(groupId)}/messages`);
            if (!response.ok) {
                throw new Error('Unable to fetch messages');
            }
            const payload = (await response.json());
            setMessages(payload);
        }
        catch (error) {
            console.error(error);
        }
    }
    function handleSelectChat(groupId) {
        setSelectedGroupId(groupId);
        fetchMessages(groupId);
    }
    function handleRegistered(profile) {
        setUser(profile);
        refreshChats();
    }
    function handleUpdated(profile) {
        setUser(profile);
        refreshChats();
    }
    return (_jsxs("div", { children: [_jsx("h1", { children: "Kibitz Control Center" }), _jsx("p", { children: "Register, connect integrations, distribute OTPs, and monitor chats. When a group across MMS + other platforms has the same members, everyone can approve sharing to merge their timelines." }), _jsx(RegistrationForm, { onRegistered: handleRegistered }), _jsx(ConsentStatusCard, { user: user }), _jsx(OAuthConnect, { user: user, onUpdated: handleUpdated }), _jsx(ChatList, { chats: chats, selectedGroupId: selectedGroupId, onSelect: handleSelectChat }), _jsx(MessageFeed, { groupId: selectedGroupId, messages: messages }), _jsxs("div", { className: "card", children: [_jsx("h2", { children: "Need to revoke access?" }), _jsxs("p", { children: ["Inside any chat, simply send ", _jsx("code", { children: "revoke" }), ". The backend persists consent state, so the command works even after restarts."] }), _jsxs("p", { children: ["To link identical chats, once everyone has authorized their chat, send ", _jsx("code", { children: "share yes" }), " from each location when prompted."] })] })] }));
}
function upsertChat(list, next) {
    const existingIndex = list.findIndex((chat) => chat.channel === next.channel);
    if (existingIndex === -1) {
        return [...list, next];
    }
    const clone = [...list];
    clone[existingIndex] = next;
    return clone;
}
function upsertMessage(list, next) {
    const existingIndex = list.findIndex((message) => message.id === next.id);
    if (existingIndex === -1) {
        return [...list, next].sort((a, b) => a.postedAt.localeCompare(b.postedAt));
    }
    const clone = [...list];
    clone[existingIndex] = next;
    return clone.sort((a, b) => a.postedAt.localeCompare(b.postedAt));
}
