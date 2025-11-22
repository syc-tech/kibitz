import { proxyActivities } from '@temporalio/workflow';
import type { activities } from '../activities/messageActivities';
import { MessageWorkflowInput, PostMessageResult } from '../types/messages';

const { resolveTemplateActivity, postMessageActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute'
});

export async function processMessageWorkflow(
  input: MessageWorkflowInput
): Promise<PostMessageResult> {
  const parsed = await resolveTemplateActivity(input);
  return postMessageActivity({
    ...parsed,
    channel: input.channel,
    replyTo: input.originalMessageId,
    originalMessage: input.message,
    author: input.author
  });
}
