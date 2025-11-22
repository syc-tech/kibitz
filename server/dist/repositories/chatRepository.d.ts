import { ChatRecord } from '../types/chat';
export declare class ChatRepository {
    list(): Promise<ChatRecord[]>;
    getByChannel(channel: string): Promise<ChatRecord | undefined>;
    save(record: ChatRecord): Promise<void>;
    saveMany(records: ChatRecord[]): Promise<void>;
}
