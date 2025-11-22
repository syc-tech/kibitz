import { MessageWorkflowInput, PostMessageResult } from '../types/messages';
export declare class MessageService {
    private readonly taskQueue;
    private clientPromise?;
    constructor(taskQueue?: string);
    processMessage(input: MessageWorkflowInput): Promise<PostMessageResult>;
    private getTemporalClient;
    private buildWorkflowId;
}
