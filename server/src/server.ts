import express, { Express } from 'express';
import type { Server } from 'node:http';
import { DEFAULT_SERVER_PORT } from './config/constants';
import { messageRouter } from './routes/messageRoutes';
import { userRouter } from './routes/userRoutes';
import { twilioRouter } from './routes/twilioRoutes';
import { chatRouter } from './routes/chatRoutes';
import { eventRouter } from './routes/eventRoutes';

export async function createServer(): Promise<Express> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));
  app.use('/api', messageRouter);
  app.use('/api/users', userRouter);
  app.use('/api/chats', chatRouter);
  app.use('/api/twilio', twilioRouter);
  app.use('/api', eventRouter);
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = typeof (error as any)?.status === 'number' ? (error as any).status : 500;
    const message =
      error instanceof Error ? error.message : status === 400 ? 'Bad request' : 'Internal server error';
    if (status >= 500) {
      console.error('Unhandled error', error);
    }
    res.status(status).json({ error: message });
  });
  return app;
}

export interface StartServerResult {
  app: Express;
  server: Server;
}

export async function startHttpServer(port = DEFAULT_SERVER_PORT): Promise<StartServerResult> {
  const app = await createServer();

  return new Promise<StartServerResult>((resolve) => {
    const server = app.listen(port, () => {
      console.log(`HTTP server listening on port ${port}`);
      resolve({ app, server });
    });
  });
}
