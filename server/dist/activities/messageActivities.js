"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activities = void 0;
exports.resolveTemplateActivity = resolveTemplateActivity;
exports.postMessageActivity = postMessageActivity;
const node_crypto_1 = require("node:crypto");
const messageParser_1 = require("../lib/messageParser");
const twilioService_1 = require("../services/twilioService");
const twilioService = new twilioService_1.TwilioService();
async function resolveTemplateActivity(input) {
    return (0, messageParser_1.renderTemplate)(input.message, input.values ?? {});
}
async function postMessageActivity(input) {
    const postedAt = new Date().toISOString();
    const id = (0, node_crypto_1.randomUUID)();
    // Simulate posting to an external service by logging the final payload.
    console.info(JSON.stringify({
        type: 'message.bot_response',
        id,
        channel: input.channel ?? 'default',
        postedAt,
        replyTo: input.replyTo,
        author: input.author ?? 'kibitz-bot',
        originalMessage: input.originalMessage,
        message: input.rendered,
        missingKeys: input.missingKeys,
        substitutions: input.substitutions
    }, null, 2));
    if (input.channel?.startsWith('twilio')) {
        try {
            await twilioService.sendMessage(input.channel, input.rendered);
        }
        catch (error) {
            console.error('Failed to send Twilio message', error);
        }
    }
    return {
        id,
        postedAt,
        channel: input.channel,
        replyTo: input.replyTo,
        author: input.author,
        originalMessage: input.originalMessage,
        rendered: input.rendered,
        missingKeys: input.missingKeys,
        substitutions: input.substitutions,
        placeholders: input.placeholders
    };
}
exports.activities = {
    resolveTemplateActivity,
    postMessageActivity
};
//# sourceMappingURL=messageActivities.js.map