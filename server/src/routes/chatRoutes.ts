import { Router } from 'express';
import { ChatService } from '../services/chatService';

const chatService = new ChatService();
export const chatRouter = Router();

chatRouter.get('/', async (_req, res, next) => {
  try {
    const chats = await chatService.listChats();
    res.json(chats);
  } catch (error) {
    next(error);
  }
});

chatRouter.get('/:sharedGroupId/messages', async (req, res, next) => {
  try {
    const messages = await chatService.listMessages(req.params.sharedGroupId);
    res.json(messages);
  } catch (error) {
    next(error);
  }
});
