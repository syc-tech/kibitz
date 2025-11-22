"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageService = void 0;
const client_1 = require("@temporalio/client");
const messageActivities_1 = require("../activities/messageActivities");
const constants_1 = require("../config/constants");
const workflows_1 = require("../workflows");
const BYPASS_TEMPORAL = process.env.BYPASS_TEMPORAL === 'true';
class MessageService {
    constructor(taskQueue = constants_1.TASK_QUEUE) {
        this.taskQueue = taskQueue;
    }
    async processMessage(input) {
        if (BYPASS_TEMPORAL) {
            const parsed = await (0, messageActivities_1.resolveTemplateActivity)(input);
            return (0, messageActivities_1.postMessageActivity)({
                ...parsed,
                channel: input.channel,
                replyTo: input.originalMessageId,
                originalMessage: input.message,
                author: input.author
            });
        }
        const client = await this.getTemporalClient();
        const workflowId = this.buildWorkflowId();
        const handle = await client.workflow.start(workflows_1.processMessageWorkflow, {
            args: [input],
            taskQueue: this.taskQueue,
            workflowId
        });
        return handle.result();
    }
    async getTemporalClient() {
        if (!this.clientPromise) {
            this.clientPromise = client_1.Connection.connect().then((connection) => new client_1.Client({ connection }));
        }
        return this.clientPromise;
    }
    buildWorkflowId() {
        const nonce = Math.random().toString(36).slice(2, 10);
        return `message-${Date.now()}-${nonce}`;
    }
}
exports.MessageService = MessageService;
//# sourceMappingURL=messageService.js.map