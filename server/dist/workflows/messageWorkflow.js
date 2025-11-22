"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMessageWorkflow = processMessageWorkflow;
const workflow_1 = require("@temporalio/workflow");
const { resolveTemplateActivity, postMessageActivity } = (0, workflow_1.proxyActivities)({
    startToCloseTimeout: '1 minute'
});
async function processMessageWorkflow(input) {
    const parsed = await resolveTemplateActivity(input);
    return postMessageActivity({
        ...parsed,
        channel: input.channel,
        replyTo: input.originalMessageId,
        originalMessage: input.message,
        author: input.author
    });
}
//# sourceMappingURL=messageWorkflow.js.map