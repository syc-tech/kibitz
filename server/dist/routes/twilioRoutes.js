"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.twilioRouter = void 0;
const express_1 = __importStar(require("express"));
const messageService_1 = require("../services/messageService");
const consentService_1 = require("../services/consentService");
const chatService_1 = require("../services/chatService");
const messageProcessor_1 = require("../services/messageProcessor");
const router = (0, express_1.Router)();
const messageService = new messageService_1.MessageService();
const consentService = new consentService_1.ConsentService();
const chatService = new chatService_1.ChatService();
const processor = new messageProcessor_1.MessageProcessor(consentService, messageService, chatService);
router.post('/mms', express_1.default.urlencoded({ extended: false }), async (req, res, next) => {
    try {
        const payload = req.body;
        const message = payload.Body ?? '';
        const from = payload.From ?? 'unknown';
        const to = payload.To ?? 'twilio';
        const conversation = payload.ConversationSid
            ? `twilio:conversation:${payload.ConversationSid}`
            : `twilio:${to}`;
        const messageId = payload.MessageSid;
        const result = await processor.process({
            message,
            values: {},
            channel: conversation,
            messageId,
            author: from,
            metadata: {
                transport: 'twilio',
                payload
            }
        });
        if (result.resultType === 'workflow') {
            res
                .type('text/xml')
                .send(`<Response><Message>Processed: ${escapeXml(result.workflowResult?.rendered ?? 'ok')}</Message></Response>`);
        }
        else {
            const text = typeof result.body === 'object' ? result.body.message ?? 'ok' : 'ok';
            res.type('text/xml').send(`<Response><Message>${escapeXml(String(text))}</Message></Response>`);
        }
    }
    catch (error) {
        next(error);
    }
});
function escapeXml(input) {
    return input.replace(/[<>&"']/g, (char) => {
        switch (char) {
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '&':
                return '&amp;';
            case '"':
                return '&quot;';
            case "'":
                return '&apos;';
            default:
                return char;
        }
    });
}
exports.twilioRouter = router;
//# sourceMappingURL=twilioRoutes.js.map