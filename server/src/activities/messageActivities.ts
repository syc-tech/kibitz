import { randomUUID } from 'node:crypto';
import { renderTemplate } from '../lib/messageParser';
import { MessageWorkflowInput, ParsedMessageResult, PostMessageResult } from '../types/messages';
import { TwilioService } from '../services/twilioService';

const twilioService = new TwilioService();

export async function resolveTemplateActivity(
  input: MessageWorkflowInput
): Promise<ParsedMessageResult> {
  return renderTemplate(input.message, input.values ?? {});
}

export interface PostMessageActivityInput extends ParsedMessageResult {
  channel?: string;
  metadata?: Record<string, unknown>;
  replyTo?: string;
  originalMessage?: string;
  author?: string;
}

export async function postMessageActivity(
  input: PostMessageActivityInput
): Promise<PostMessageResult> {
  const postedAt = new Date().toISOString();
  const id = randomUUID();

  // Simulate posting to an external service by logging the final payload.
  console.info(
    JSON.stringify(
      {
        type: 'message.bot_response',
        id,
        channel: input.channel ?? 'default',
        postedAt,
        replyTo: input.replyTo,
        author: input.author ?? 'kibitz-bot',
        originalMessage: input.originalMessage,
        message: input.rendered,
        missingKeys: input.missingKeys,
        substitutions: input.substitutions
      },
      null,
      2
    )
  );

  if (input.channel?.startsWith('twilio')) {
    try {
      await twilioService.sendMessage(input.channel, input.rendered);
    } catch (error) {
      console.error('Failed to send Twilio message', error);
    }
  }

  return {
    id,
    postedAt,
    channel: input.channel,
    replyTo: input.replyTo,
    author: input.author,
    originalMessage: input.originalMessage,
    rendered: input.rendered,
    missingKeys: input.missingKeys,
    substitutions: input.substitutions,
    placeholders: input.placeholders
  };
}

export const activities = {
  resolveTemplateActivity,
  postMessageActivity
};
