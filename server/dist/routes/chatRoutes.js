"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const chatService_1 = require("../services/chatService");
const chatService = new chatService_1.ChatService();
exports.chatRouter = (0, express_1.Router)();
exports.chatRouter.get('/', async (_req, res, next) => {
    try {
        const chats = await chatService.listChats();
        res.json(chats);
    }
    catch (error) {
        next(error);
    }
});
exports.chatRouter.get('/:sharedGroupId/messages', async (req, res, next) => {
    try {
        const messages = await chatService.listMessages(req.params.sharedGroupId);
        res.json(messages);
    }
    catch (error) {
        next(error);
    }
});
//# sourceMappingURL=chatRoutes.js.map