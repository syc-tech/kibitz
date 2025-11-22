import { randomUUID } from 'node:crypto';
import { ConsentStatus } from '../types/consent';
import { ChatLinkOffer, ChatParticipant, ChatRecord, MessageRecord } from '../types/chat';
import { ChatRepository } from '../repositories/chatRepository';
import { MessageRepository } from '../repositories/messageRepository';
import { PostMessageResult } from '../types/messages';
import { eventBus } from './eventBus';

interface RecordParticipationResult {
  chat: ChatRecord;
  participant: ChatParticipant;
  participantKey: string;
  linkOffer?: ChatLinkOffer;
}

export class ChatService {
  constructor(
    private readonly chatRepository = new ChatRepository(),
    private readonly messageRepository = new MessageRepository()
  ) {}

  async recordParticipation(
    channel: string | undefined,
    authorId: string | undefined,
    consent: ConsentStatus,
    username?: string
  ): Promise<RecordParticipationResult> {
    const channelId = channel ?? 'default';
    const safeAuthor = authorId ?? 'anonymous';
    const participantKey = this.buildParticipantKey(consent, safeAuthor);

    let chat = await this.chatRepository.getByChannel(channelId);
    if (!chat) {
      chat = {
        id: channelId,
        channel: channelId,
        participants: [],
        sharedGroupId: channelId,
        pendingLinkGroupId: undefined,
        pendingLinkTargetId: undefined,
        pendingApprovals: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const existingParticipant = chat.participants.find((entry) => entry.key === participantKey);
    if (existingParticipant) {
      existingParticipant.lastSeenAt = new Date().toISOString();
    } else {
      chat.participants.push({
        key: participantKey,
        authorId: safeAuthor,
        username,
        consentType: consent.type,
        lastSeenAt: new Date().toISOString()
      });
    }

    chat.updatedAt = new Date().toISOString();
    await this.chatRepository.save(chat);
    eventBus.emitChatUpdated(chat);

    const linkOffer = await this.evaluateLinkOffer(chat);

    return {
      chat,
      participant: existingParticipant ?? chat.participants[chat.participants.length - 1],
      participantKey,
      linkOffer
    };
  }

  async approveLink(channel: string | undefined, participantKey: string): Promise<{ linked: boolean; message: string }> {
    const channelId = channel ?? 'default';
    const chat = await this.chatRepository.getByChannel(channelId);
    if (!chat || !chat.pendingLinkGroupId || !chat.pendingLinkTargetId) {
      return { linked: false, message: 'No link offer is pending for this chat.' };
    }

    if (!chat.pendingApprovals.includes(participantKey)) {
      chat.pendingApprovals.push(participantKey);
    }

    const targetChat = await this.chatRepository.getByChannel(chat.pendingLinkTargetId);
    if (!targetChat) {
      chat.pendingLinkGroupId = undefined;
      chat.pendingLinkTargetId = undefined;
      chat.pendingApprovals = [];
      await this.chatRepository.save(chat);
      return { linked: false, message: 'Target chat was not found. Please try again later.' };
    }

    const allKeys = new Set<string>([
      ...chat.participants.map((p) => p.key),
      ...targetChat.participants.map((p) => p.key)
    ]);

    const approvals = new Set<string>([
      ...chat.pendingApprovals,
      ...(targetChat.pendingApprovals ?? [])
    ]);

    if (approvals.size >= allKeys.size) {
      const sharedGroupId = chat.sharedGroupId === targetChat.sharedGroupId ? chat.sharedGroupId : randomUUID();

      chat.sharedGroupId = sharedGroupId;
      targetChat.sharedGroupId = sharedGroupId;
      chat.pendingLinkGroupId = undefined;
      targetChat.pendingLinkGroupId = undefined;
      chat.pendingLinkTargetId = undefined;
      targetChat.pendingLinkTargetId = undefined;
      chat.pendingApprovals = [];
      targetChat.pendingApprovals = [];

      await this.chatRepository.saveMany([chat, targetChat]);
      eventBus.emitChatUpdated(chat);
      eventBus.emitChatUpdated(targetChat);
      return { linked: true, message: 'Chats linked. Future data will be shared between them.' };
    }

    const serializedApprovals = Array.from(approvals);
    chat.pendingApprovals = serializedApprovals;
    targetChat.pendingApprovals = serializedApprovals;
    await this.chatRepository.saveMany([chat, targetChat]);
    eventBus.emitChatUpdated(chat);
    eventBus.emitChatUpdated(targetChat);
    return {
      linked: false,
      message: 'Link offer recorded. Waiting for all participants to accept.'
    };
  }

  async storeMessage(
    chat: ChatRecord,
    message: PostMessageResult,
    participantKey: string,
    authorId: string | undefined
  ): Promise<MessageRecord> {
    const record: MessageRecord = {
      id: message.id,
      chatId: chat.id,
      sharedGroupId: chat.sharedGroupId,
      authorId: authorId ?? 'anonymous',
      authorKey: participantKey,
      originalMessage: message.originalMessage ?? message.rendered,
      renderedMessage: message.rendered,
      postedAt: message.postedAt,
      channel: message.channel
    };

    await this.messageRepository.append(record);
    eventBus.emitMessageCreated(record);
    return record;
  }

  async listChats(): Promise<ChatRecord[]> {
    return this.chatRepository.list();
  }

  async listMessages(sharedGroupId: string): Promise<MessageRecord[]> {
    return this.messageRepository.findBySharedGroup(sharedGroupId);
  }

  private async evaluateLinkOffer(chat: ChatRecord): Promise<ChatLinkOffer | undefined> {
    const participantsSignature = this.buildSignature(chat.participants.map((entry) => entry.key));
    const allChats = await this.chatRepository.list();

    const candidate = allChats.find((entry) => {
      if (entry.channel === chat.channel) {
        return false;
      }
      if (entry.sharedGroupId === chat.sharedGroupId) {
        return false;
      }
      const signature = this.buildSignature(entry.participants.map((participant) => participant.key));
      return signature === participantsSignature && entry.participants.length === chat.participants.length;
    });

    if (!candidate) {
      return undefined;
    }

    if (chat.pendingLinkGroupId && candidate.pendingLinkGroupId) {
      return undefined;
    }

    const pendingGroupId = chat.pendingLinkGroupId ?? candidate.pendingLinkGroupId ?? randomUUID();
    chat.pendingLinkGroupId = pendingGroupId;
    candidate.pendingLinkGroupId = pendingGroupId;
    chat.pendingLinkTargetId = candidate.channel;
    candidate.pendingLinkTargetId = chat.channel;
    chat.pendingApprovals = [];
    candidate.pendingApprovals = [];

    await this.chatRepository.saveMany([chat, candidate]);
    eventBus.emitChatUpdated(chat);
    eventBus.emitChatUpdated(candidate);

    return {
      chatId: chat.channel,
      targetChatId: candidate.channel,
      pendingLinkGroupId: pendingGroupId,
      participants: chat.participants.map((participant) => participant.key)
    };
  }

  private buildParticipantKey(consent: ConsentStatus, authorId: string): string {
    if (consent.type === 'linked') {
      return `user:${consent.userId}`;
    }

    return `anon:${authorId}`;
  }

  private buildSignature(keys: string[]): string {
    return [...keys].sort().join('|');
  }
}
