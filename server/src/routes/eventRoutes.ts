import { Router } from 'express';
import { eventBus } from '../services/eventBus';

export const eventRouter = Router();

eventRouter.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const handleChat = (chat: any) => send('chat-updated', chat);
  const handleMessage = (message: any) => send('message-created', message);

  eventBus.on('chat-updated', handleChat);
  eventBus.on('message-created', handleMessage);

  const keepAlive = setInterval(() => res.write(':keep-alive\n\n'), 25000);

  req.on('close', () => {
    clearInterval(keepAlive);
    eventBus.off('chat-updated', handleChat);
    eventBus.off('message-created', handleMessage);
  });
});
