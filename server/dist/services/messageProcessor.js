"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageProcessor = void 0;
const SHARE_ACCEPT_PATTERN = /^(?:share|linkchat)\s+yes$/i;
class MessageProcessor {
    constructor(consentService, messageService, chatService) {
        this.consentService = consentService;
        this.messageService = messageService;
        this.chatService = chatService;
    }
    async process(payload) {
        const values = payload.values ?? {};
        const consentDecision = await this.consentService.handleMessage(payload.channel, payload.author, payload.message);
        if (consentDecision.type === 'denied') {
            return { statusCode: 403, body: { error: consentDecision.message }, resultType: 'denied' };
        }
        if (consentDecision.type === 'link-confirmed' || consentDecision.type === 'ephemeral-confirmed') {
            return {
                statusCode: 200,
                body: {
                    status: consentDecision.type,
                    message: consentDecision.message
                },
                resultType: 'consent'
            };
        }
        if (consentDecision.type === 'revoked') {
            return {
                statusCode: 200,
                body: {
                    status: 'revoked',
                    message: consentDecision.message
                },
                resultType: 'consent'
            };
        }
        const participantKey = this.buildParticipantKey(consentDecision.status, payload.author ?? 'anonymous');
        if (SHARE_ACCEPT_PATTERN.test(payload.message.trim())) {
            const shareResult = await this.chatService.approveLink(payload.channel, participantKey);
            return {
                statusCode: 200,
                body: {
                    status: shareResult.linked ? 'linked' : 'pending',
                    message: shareResult.message
                },
                resultType: 'share'
            };
        }
        const participation = await this.chatService.recordParticipation(payload.channel, payload.author, consentDecision.status, payload.author);
        const workflowInput = {
            message: payload.message,
            values,
            channel: payload.channel,
            metadata: {
                ...(payload.metadata ?? {}),
                consent: consentDecision.status
            },
            originalMessageId: payload.messageId,
            author: payload.author
        };
        const workflowResult = await this.messageService.processMessage(workflowInput);
        await this.chatService.storeMessage(participation.chat, workflowResult, participation.participantKey, payload.author);
        return {
            statusCode: 201,
            body: {
                ...workflowResult,
                linkOffer: participation.linkOffer ?? null
            },
            resultType: 'workflow',
            workflowResult,
            linkOffer: participation.linkOffer
        };
    }
    buildParticipantKey(consent, author) {
        if (consent.type === 'linked') {
            return `user:${consent.userId}`;
        }
        return `anon:${author}`;
    }
}
exports.MessageProcessor = MessageProcessor;
//# sourceMappingURL=messageProcessor.js.map