import { ConsentService } from './consentService';
import { MessageService } from './messageService';
import { ChatService } from './chatService';
import { TemplateValues } from '../types/messages';
import { PostMessageResult } from '../types/messages';
export interface InboundMessagePayload {
    message: string;
    values?: TemplateValues;
    channel?: string;
    metadata?: Record<string, unknown>;
    messageId?: string;
    author?: string;
}
export interface ProcessedMessageResponse {
    statusCode: number;
    body: unknown;
    resultType: 'workflow' | 'consent' | 'denied' | 'share';
    workflowResult?: PostMessageResult;
    linkOffer?: unknown;
}
export declare class MessageProcessor {
    private readonly consentService;
    private readonly messageService;
    private readonly chatService;
    constructor(consentService: ConsentService, messageService: MessageService, chatService: ChatService);
    process(payload: InboundMessagePayload): Promise<ProcessedMessageResponse>;
    private buildParticipantKey;
}
