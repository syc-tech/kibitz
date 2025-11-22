import twilio, { Twilio } from 'twilio';
import { ChatRepository } from '../repositories/chatRepository';

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;
const DEFAULT_FROM = process.env.TWILIO_DEFAULT_FROM;

export class TwilioService {
  private readonly client: Twilio | null;
  private readonly chatRepository = new ChatRepository();

  constructor() {
    if (ACCOUNT_SID && AUTH_TOKEN) {
      this.client = twilio(ACCOUNT_SID, AUTH_TOKEN);
    } else {
      this.client = null;
    }
  }

  async sendMessage(channel: string | undefined, body: string): Promise<void> {
    if (!channel) {
      return;
    }

    if (!this.client || !MESSAGING_SERVICE_SID) {
      console.info('Twilio not configured; logging message instead', { channel, body });
      return;
    }

    const chat = await this.chatRepository.getByChannel(channel);
    if (!chat) {
      console.warn('Unable to find chat for channel; skipping Twilio send', channel);
      return;
    }

    const recipients = chat.participants.map((participant) => participant.authorId);
    const sender = DEFAULT_FROM;

    await Promise.all(
      recipients.map((to) =>
        this.client!.messages.create({
          messagingServiceSid: MESSAGING_SERVICE_SID,
          body,
          to,
          from: sender ?? undefined
        })
      )
    );
  }
}
