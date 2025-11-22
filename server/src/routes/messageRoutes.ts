import { Router } from 'express';
import { z } from 'zod';
import { MessageService } from '../services/messageService';
import { ConsentService } from '../services/consentService';
import { ChatService } from '../services/chatService';
import { MessageProcessor } from '../services/messageProcessor';
import { TemplateValues } from '../types/messages';

const service = new MessageService();
const consentService = new ConsentService();
const chatService = new ChatService();
const processor = new MessageProcessor(consentService, service, chatService);

const messageSchema = z.object({
  message: z.string().min(1, 'message is required'),
  values: z.record(z.any()).default({}),
  channel: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  messageId: z.string().optional(),
  author: z.string().optional()
});

export const messageRouter = Router();

messageRouter.post('/messages', async (req, res, next) => {
  try {
    const payload = messageSchema.parse(req.body);
    console.info(
      JSON.stringify(
        {
          type: 'message.received',
          messageId: payload.messageId,
          channel: payload.channel ?? 'default',
          author: payload.author ?? 'unknown',
          message: payload.message
        },
        null,
        2
      )
    );
    const result = await processor.process({
      message: payload.message,
      values: payload.values as TemplateValues,
      channel: payload.channel,
      metadata: payload.metadata,
      messageId: payload.messageId,
      author: payload.author
    });

    res.status(result.statusCode).json(result.body);
  } catch (error) {
    next(error);
  }
});
