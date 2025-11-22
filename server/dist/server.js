"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
exports.startHttpServer = startHttpServer;
const express_1 = __importDefault(require("express"));
const constants_1 = require("./config/constants");
const messageRoutes_1 = require("./routes/messageRoutes");
const userRoutes_1 = require("./routes/userRoutes");
const twilioRoutes_1 = require("./routes/twilioRoutes");
const chatRoutes_1 = require("./routes/chatRoutes");
const eventRoutes_1 = require("./routes/eventRoutes");
async function createServer() {
    const app = (0, express_1.default)();
    app.use(express_1.default.json({ limit: '1mb' }));
    app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
    app.use('/api', messageRoutes_1.messageRouter);
    app.use('/api/users', userRoutes_1.userRouter);
    app.use('/api/chats', chatRoutes_1.chatRouter);
    app.use('/api/twilio', twilioRoutes_1.twilioRouter);
    app.use('/api', eventRoutes_1.eventRouter);
    app.use((error, _req, res, _next) => {
        const status = typeof error?.status === 'number' ? error.status : 500;
        const message = error instanceof Error ? error.message : status === 400 ? 'Bad request' : 'Internal server error';
        if (status >= 500) {
            console.error('Unhandled error', error);
        }
        res.status(status).json({ error: message });
    });
    return app;
}
async function startHttpServer(port = constants_1.DEFAULT_SERVER_PORT) {
    const app = await createServer();
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            console.log(`HTTP server listening on port ${port}`);
            resolve({ app, server });
        });
    });
}
//# sourceMappingURL=server.js.map