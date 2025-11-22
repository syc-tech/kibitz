"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const node_crypto_1 = require("node:crypto");
const chatRepository_1 = require("../repositories/chatRepository");
const messageRepository_1 = require("../repositories/messageRepository");
const eventBus_1 = require("./eventBus");
class ChatService {
    constructor(chatRepository = new chatRepository_1.ChatRepository(), messageRepository = new messageRepository_1.MessageRepository()) {
        this.chatRepository = chatRepository;
        this.messageRepository = messageRepository;
    }
    async recordParticipation(channel, authorId, consent, username) {
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
        }
        else {
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
        eventBus_1.eventBus.emitChatUpdated(chat);
        const linkOffer = await this.evaluateLinkOffer(chat);
        return {
            chat,
            participant: existingParticipant ?? chat.participants[chat.participants.length - 1],
            participantKey,
            linkOffer
        };
    }
    async approveLink(channel, participantKey) {
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
        const allKeys = new Set([
            ...chat.participants.map((p) => p.key),
            ...targetChat.participants.map((p) => p.key)
        ]);
        const approvals = new Set([
            ...chat.pendingApprovals,
            ...(targetChat.pendingApprovals ?? [])
        ]);
        if (approvals.size >= allKeys.size) {
            const sharedGroupId = chat.sharedGroupId === targetChat.sharedGroupId ? chat.sharedGroupId : (0, node_crypto_1.randomUUID)();
            chat.sharedGroupId = sharedGroupId;
            targetChat.sharedGroupId = sharedGroupId;
            chat.pendingLinkGroupId = undefined;
            targetChat.pendingLinkGroupId = undefined;
            chat.pendingLinkTargetId = undefined;
            targetChat.pendingLinkTargetId = undefined;
            chat.pendingApprovals = [];
            targetChat.pendingApprovals = [];
            await this.chatRepository.saveMany([chat, targetChat]);
            eventBus_1.eventBus.emitChatUpdated(chat);
            eventBus_1.eventBus.emitChatUpdated(targetChat);
            return { linked: true, message: 'Chats linked. Future data will be shared between them.' };
        }
        const serializedApprovals = Array.from(approvals);
        chat.pendingApprovals = serializedApprovals;
        targetChat.pendingApprovals = serializedApprovals;
        await this.chatRepository.saveMany([chat, targetChat]);
        eventBus_1.eventBus.emitChatUpdated(chat);
        eventBus_1.eventBus.emitChatUpdated(targetChat);
        return {
            linked: false,
            message: 'Link offer recorded. Waiting for all participants to accept.'
        };
    }
    async storeMessage(chat, message, participantKey, authorId) {
        const record = {
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
        eventBus_1.eventBus.emitMessageCreated(record);
        return record;
    }
    async listChats() {
        return this.chatRepository.list();
    }
    async listMessages(sharedGroupId) {
        return this.messageRepository.findBySharedGroup(sharedGroupId);
    }
    async evaluateLinkOffer(chat) {
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
        const pendingGroupId = chat.pendingLinkGroupId ?? candidate.pendingLinkGroupId ?? (0, node_crypto_1.randomUUID)();
        chat.pendingLinkGroupId = pendingGroupId;
        candidate.pendingLinkGroupId = pendingGroupId;
        chat.pendingLinkTargetId = candidate.channel;
        candidate.pendingLinkTargetId = chat.channel;
        chat.pendingApprovals = [];
        candidate.pendingApprovals = [];
        await this.chatRepository.saveMany([chat, candidate]);
        eventBus_1.eventBus.emitChatUpdated(chat);
        eventBus_1.eventBus.emitChatUpdated(candidate);
        return {
            chatId: chat.channel,
            targetChatId: candidate.channel,
            pendingLinkGroupId: pendingGroupId,
            participants: chat.participants.map((participant) => participant.key)
        };
    }
    buildParticipantKey(consent, authorId) {
        if (consent.type === 'linked') {
            return `user:${consent.userId}`;
        }
        return `anon:${authorId}`;
    }
    buildSignature(keys) {
        return [...keys].sort().join('|');
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chatService.js.map