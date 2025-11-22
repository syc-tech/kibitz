import { ConsentStatus } from '../types/consent';
export declare class ConsentRepository {
    get(key: string): Promise<ConsentStatus | undefined>;
    set(key: string, status: ConsentStatus): Promise<void>;
    delete(key: string): Promise<void>;
}
