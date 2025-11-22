"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const messageService_1 = require("../services/messageService");
const consentService_1 = require("../services/consentService");
const chatService_1 = require("../services/chatService");
const messageProcessor_1 = require("../services/messageProcessor");
const service = new messageService_1.MessageService();
const consentService = new consentService_1.ConsentService();
const chatService = new chatService_1.ChatService();
const processor = new messageProcessor_1.MessageProcessor(consentService, service, chatService);
const messageSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, 'message is required'),
    values: zod_1.z.record(zod_1.z.any()).default({}),
    channel: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    messageId: zod_1.z.string().optional(),
    author: zod_1.z.string().optional()
});
exports.messageRouter = (0, express_1.Router)();
exports.messageRouter.post('/messages', async (req, res, next) => {
    try {
        const payload = messageSchema.parse(req.body);
        console.info(JSON.stringify({
            type: 'message.received',
            messageId: payload.messageId,
            channel: payload.channel ?? 'default',
            author: payload.author ?? 'unknown',
            message: payload.message
        }, null, 2));
        const result = await processor.process({
            message: payload.message,
            values: payload.values,
            channel: payload.channel,
            metadata: payload.metadata,
            messageId: payload.messageId,
            author: payload.author
        });
        res.status(result.statusCode).json(result.body);
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=messageRoutes.js.map