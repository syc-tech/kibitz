import { Client, Connection } from '@temporalio/client';
import { postMessageActivity, resolveTemplateActivity } from '../activities/messageActivities';
import { TASK_QUEUE } from '../config/constants';
import { MessageWorkflowInput, PostMessageResult } from '../types/messages';
import { processMessageWorkflow } from '../workflows';

const BYPASS_TEMPORAL = process.env.BYPASS_TEMPORAL === 'true';

export class MessageService {
  private clientPromise?: Promise<Client>;

  constructor(private readonly taskQueue = TASK_QUEUE) {}

  async processMessage(input: MessageWorkflowInput): Promise<PostMessageResult> {
    if (BYPASS_TEMPORAL) {
      const parsed = await resolveTemplateActivity(input);
      return postMessageActivity({
        ...parsed,
        channel: input.channel,
        replyTo: input.originalMessageId,
        originalMessage: input.message,
        author: input.author
      });
    }

    const client = await this.getTemporalClient();
    const workflowId = this.buildWorkflowId();

    const handle = await client.workflow.start(processMessageWorkflow, {
      args: [input],
      taskQueue: this.taskQueue,
      workflowId
    });

    return handle.result();
  }

  private async getTemporalClient(): Promise<Client> {
    if (!this.clientPromise) {
      this.clientPromise = Connection.connect().then((connection) => new Client({ connection }));
    }

    return this.clientPromise;
  }

  private buildWorkflowId(): string {
    const nonce = Math.random().toString(36).slice(2, 10);
    return `message-${Date.now()}-${nonce}`;
  }
}
