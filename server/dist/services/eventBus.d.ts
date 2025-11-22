import { EventEmitter } from 'node:events';
import { ChatRecord, MessageRecord } from '../types/chat';
export type ChatEvent = {
    type: 'chat-updated';
    chat: ChatRecord;
};
export type MessageEvent = {
    type: 'message-created';
    message: MessageRecord;
};
declare class KibitzEventBus extends EventEmitter {
    emitChatUpdated(chat: ChatRecord): void;
    emitMessageCreated(message: MessageRecord): void;
}
export declare const eventBus: KibitzEventBus;
export {};
