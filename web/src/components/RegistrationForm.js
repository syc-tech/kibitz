import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
export function RegistrationForm({ onRegistered }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    async function handleSubmit(event) {
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
            const payload = await response.json();
            onRegistered(payload);
            setMessage(`User registered. OTP: ${payload.otp}`);
        }
        catch (error) {
            setMessage(error.message);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs("div", { className: "card", children: [_jsx("h2", { children: "Create an account" }), _jsx("p", { children: "Register to receive a one-time password for linking chats to your identity." }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("label", { children: ["Username", _jsx("input", { value: username, onChange: (event) => setUsername(event.target.value), required: true, minLength: 2 })] }), _jsxs("label", { children: ["Email", _jsx("input", { type: "email", value: email, onChange: (event) => setEmail(event.target.value), required: true })] }), _jsx("button", { type: "submit", disabled: loading, children: loading ? 'Creating account…' : 'Register' })] }), message && _jsx("div", { className: "status", children: message })] }));
}
