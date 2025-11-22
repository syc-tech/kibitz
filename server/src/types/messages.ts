export type TemplatePrimitive = string | number | boolean | null;
export type TemplateValues = {
  [key: string]: TemplatePrimitive | TemplateValues | undefined;
};

export interface MessageWorkflowInput {
  message: string;
  values: TemplateValues;
  channel?: string;
  metadata?: Record<string, unknown>;
  originalMessageId?: string;
  author?: string;
}

export interface ParsedMessageResult {
  rendered: string;
  missingKeys: string[];
  substitutions: Record<string, string>;
  placeholders: string[];
}

export interface PostMessageResult extends ParsedMessageResult {
  id: string;
  channel?: string;
  postedAt: string;
  replyTo?: string;
  author?: string;
  originalMessage?: string;
}
