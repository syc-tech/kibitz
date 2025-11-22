import express, { Router } from 'express';
import { MessageService } from '../services/messageService';
import { ConsentService } from '../services/consentService';
import { ChatService } from '../services/chatService';
import { MessageProcessor } from '../services/messageProcessor';

const router = Router();
const messageService = new MessageService();
const consentService = new ConsentService();
const chatService = new ChatService();
const processor = new MessageProcessor(consentService, messageService, chatService);

router.post(
  '/mms',
  express.urlencoded({ extended: false }),
  async (req, res, next) => {
    try {
      const payload = req.body as Record<string, string | undefined>;
      const message = payload.Body ?? '';
      const from = payload.From ?? 'unknown';
      const to = payload.To ?? 'twilio';
      const conversation = payload.ConversationSid
        ? `twilio:conversation:${payload.ConversationSid}`
        : `twilio:${to}`;
      const messageId = payload.MessageSid;

      const result = await processor.process({
        message,
        values: {},
        channel: conversation,
        messageId,
        author: from,
        metadata: {
          transport: 'twilio',
          payload
        }
      });

      if (result.resultType === 'workflow') {
        res
          .type('text/xml')
          .send(
            `<Response><Message>Processed: ${escapeXml(
              result.workflowResult?.rendered ?? 'ok'
            )}</Message></Response>`
          );
      } else {
        const text = typeof result.body === 'object' ? (result.body as any).message ?? 'ok' : 'ok';
        res.type('text/xml').send(`<Response><Message>${escapeXml(String(text))}</Message></Response>`);
      }
    } catch (error) {
      next(error);
    }
  }
);

function escapeXml(input: string): string {
  return input.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      default:
        return char;
    }
  });
}

export const twilioRouter = router;
