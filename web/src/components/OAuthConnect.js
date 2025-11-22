import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const SERVICES = ['slack', 'discord', 'sms', 'email'];
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
export function OAuthConnect({ user, onUpdated }) {
    const [service, setService] = useState(SERVICES[0]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    if (!user) {
        return (_jsxs("div", { className: "card", children: [_jsx("h2", { children: "Connect services" }), _jsx("p", { children: "Register first so we know which account to link." })] }));
    }
    const currentUser = user;
    async function handleConnect(event) {
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
            const payload = (await response.json());
            onUpdated(payload);
            setMessage(`Connected to ${service}. Chats can now sync with this integration.`);
        }
        catch (error) {
            setMessage(error.message);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "card", children: [_jsx("h2", { children: "Connect services" }), _jsx("p", { children: "Authorize Kibitz to act on your behalf for each integration." }), _jsxs("form", { onSubmit: handleConnect, children: [_jsxs("label", { children: ["Choose service", _jsx("select", { value: service, onChange: (event) => setService(event.target.value), children: SERVICES.map((item) => (_jsx("option", { children: item }, item))) })] }), _jsx("button", { type: "submit", disabled: loading, children: loading ? 'Connecting…' : 'Connect service' })] }), _jsx("div", { className: "service-list", children: currentUser.services.map((svc) => (_jsxs("span", { className: "service-pill", children: [svc.name, " \u00B7 ", new Date(svc.connectedAt).toLocaleDateString()] }, svc.name))) }), message && _jsx("div", { className: "status", children: message })] }));
}
