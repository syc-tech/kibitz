"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioService = void 0;
const twilio_1 = __importDefault(require("twilio"));
const chatRepository_1 = require("../repositories/chatRepository");
const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;
const DEFAULT_FROM = process.env.TWILIO_DEFAULT_FROM;
class TwilioService {
    constructor() {
        this.chatRepository = new chatRepository_1.ChatRepository();
        if (ACCOUNT_SID && AUTH_TOKEN) {
            this.client = (0, twilio_1.default)(ACCOUNT_SID, AUTH_TOKEN);
        }
        else {
            this.client = null;
        }
    }
    async sendMessage(channel, body) {
        if (!channel) {
            return;
        }
        if (!this.client || !MESSAGING_SERVICE_SID) {
            console.info('Twilio not configured; logging message instead', { channel, body });
            return;
        }
        const chat = await this.chatRepository.getByChannel(channel);
        if (!chat) {
            console.warn('Unable to find chat for channel; skipping Twilio send', channel);
            return;
        }
        const recipients = chat.participants.map((participant) => participant.authorId);
        const sender = DEFAULT_FROM;
        await Promise.all(recipients.map((to) => this.client.messages.create({
            messagingServiceSid: MESSAGING_SERVICE_SID,
            body,
            to,
            from: sender ?? undefined
        })));
    }
}
exports.TwilioService = TwilioService;
//# sourceMappingURL=twilioService.js.map