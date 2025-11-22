import { ConsentStatus } from '../types/consent';
import { ChatLinkOffer, ChatParticipant, ChatRecord, MessageRecord } from '../types/chat';
import { ChatRepository } from '../repositories/chatRepository';
import { MessageRepository } from '../repositories/messageRepository';
import { PostMessageResult } from '../types/messages';
interface RecordParticipationResult {
    chat: ChatRecord;
    participant: ChatParticipant;
    participantKey: string;
    linkOffer?: ChatLinkOffer;
}
export declare class ChatService {
    private readonly chatRepository;
    private readonly messageRepository;
    constructor(chatRepository?: ChatRepository, messageRepository?: MessageRepository);
    recordParticipation(channel: string | undefined, authorId: string | undefined, consent: ConsentStatus, username?: string): Promise<RecordParticipationResult>;
    approveLink(channel: string | undefined, participantKey: string): Promise<{
        linked: boolean;
        message: string;
    }>;
    storeMessage(chat: ChatRecord, message: PostMessageResult, participantKey: string, authorId: string | undefined): Promise<MessageRecord>;
    listChats(): Promise<ChatRecord[]>;
    listMessages(sharedGroupId: string): Promise<MessageRecord[]>;
    private evaluateLinkOffer;
    private buildParticipantKey;
    private buildSignature;
}
export {};
