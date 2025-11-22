import { EventEmitter } from 'node:events';
import { ChatRecord, MessageRecord } from '../types/chat';

export type ChatEvent = { type: 'chat-updated'; chat: ChatRecord };
export type MessageEvent = { type: 'message-created'; message: MessageRecord };

class KibitzEventBus extends EventEmitter {
  emitChatUpdated(chat: ChatRecord) {
    this.emit('chat-updated', chat satisfies ChatRecord);
  }

  emitMessageCreated(message: MessageRecord) {
    this.emit('message-created', message satisfies MessageRecord);
  }
}

export const eventBus = new KibitzEventBus();
eventBus.setMaxListeners(50);
