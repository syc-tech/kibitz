import { MessageWorkflowInput, ParsedMessageResult, PostMessageResult } from '../types/messages';
export declare function resolveTemplateActivity(input: MessageWorkflowInput): Promise<ParsedMessageResult>;
export interface PostMessageActivityInput extends ParsedMessageResult {
    channel?: string;
    metadata?: Record<string, unknown>;
    replyTo?: string;
    originalMessage?: string;
    author?: string;
}
export declare function postMessageActivity(input: PostMessageActivityInput): Promise<PostMessageResult>;
export declare const activities: {
    resolveTemplateActivity: typeof resolveTemplateActivity;
    postMessageActivity: typeof postMessageActivity;
};
