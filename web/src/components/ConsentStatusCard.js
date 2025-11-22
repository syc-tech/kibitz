import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ConsentStatusCard({ user }) {
    if (!user) {
        return null;
    }
    return (_jsxs("div", { className: "card", children: [_jsx("h2", { children: "Link your chats" }), _jsx("p", { children: "Share the following command inside any chat where the Kibitz bot is present:" }), _jsx("pre", { children: _jsxs("code", { children: ["connect ", user.username, " ", user.otp] }) }), _jsxs("p", { children: ["Prefer to stay anonymous? Reply with ", _jsx("code", { children: "yes" }), " and Kibitz will parse messages without saving your identity."] }), _jsxs("p", { className: "badge", children: ["You can always type ", _jsx("code", { children: "revoke" }), " to remove access."] })] }));
}
