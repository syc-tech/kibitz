export declare function readJsonFile<T>(fileName: string, fallback: T): Promise<T>;
export declare function writeJsonFile(fileName: string, data: unknown): Promise<void>;
