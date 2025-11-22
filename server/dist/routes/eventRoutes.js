"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventRouter = void 0;
const express_1 = require("express");
const eventBus_1 = require("../services/eventBus");
exports.eventRouter = (0, express_1.Router)();
exports.eventRouter.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    const send = (event, data) => {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };
    const handleChat = (chat) => send('chat-updated', chat);
    const handleMessage = (message) => send('message-created', message);
    eventBus_1.eventBus.on('chat-updated', handleChat);
    eventBus_1.eventBus.on('message-created', handleMessage);
    const keepAlive = setInterval(() => res.write(':keep-alive\n\n'), 25000);
    req.on('close', () => {
        clearInterval(keepAlive);
        eventBus_1.eventBus.off('chat-updated', handleChat);
        eventBus_1.eventBus.off('message-created', handleMessage);
    });
});
//# sourceMappingURL=eventRoutes.js.map