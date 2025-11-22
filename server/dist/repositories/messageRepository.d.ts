import { MessageRecord } from '../types/chat';
export declare class MessageRepository {
    append(record: MessageRecord): Promise<void>;
    findBySharedGroup(sharedGroupId: string): Promise<MessageRecord[]>;
}
