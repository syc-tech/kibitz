"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentService = void 0;
const otpDirectory_1 = require("../lib/otpDirectory");
const consentRepository_1 = require("../repositories/consentRepository");
const userRepository_1 = require("../repositories/userRepository");
const LINK_PATTERN = /^(?:link|connect)\s+(\S+)\s+(\S+)$/i;
const YES_PATTERN = /^\s*yes\s*$/i;
const REVOKE_PATTERN = /^(?:revoke|unlink)\s*$/i;
class ConsentService {
    constructor(repository = new consentRepository_1.ConsentRepository(), directory = (0, otpDirectory_1.loadOtpDirectory)()) {
        this.repository = repository;
        this.userRepository = new userRepository_1.UserRepository();
        this.otpDirectory = directory;
    }
    async handleMessage(channel, author, message) {
        const trimmed = (message ?? '').trim();
        const key = this.getSessionKey(channel, author);
        const linkMatch = LINK_PATTERN.exec(trimmed);
        if (linkMatch) {
            return this.handleLinkCommand(key, linkMatch[1], linkMatch[2]);
        }
        if (YES_PATTERN.test(trimmed)) {
            return this.handleEphemeralConsent(key);
        }
        if (REVOKE_PATTERN.test(trimmed)) {
            return this.handleRevoke(key);
        }
        return this.ensureAuthorized(key);
    }
    async handleLinkCommand(key, username, otp) {
        const user = await this.userRepository.findByUsername(username);
        if (user && user.otp === otp) {
            const status = {
                type: 'linked',
                username: user.username,
                userId: user.id,
                linkedAt: new Date().toISOString()
            };
            await this.repository.set(key, status);
            return {
                type: 'link-confirmed',
                status,
                message: `Linked this chat to ${user.username}. Future messages will be parsed automatically.`
            };
        }
        const entry = (0, otpDirectory_1.findDirectoryEntry)(username, otp, this.otpDirectory);
        if (!entry) {
            return {
                type: 'denied',
                message: 'Invalid username or OTP. Please try again or reply "yes" to grant temporary parsing.'
            };
        }
        const status = {
            type: 'linked',
            username: entry.username,
            userId: entry.userId ?? entry.username,
            linkedAt: new Date().toISOString()
        };
        await this.repository.set(key, status);
        return {
            type: 'link-confirmed',
            status,
            message: `Linked this chat to ${entry.username}. Future messages will be parsed automatically.`
        };
    }
    async handleEphemeralConsent(key) {
        const status = {
            type: 'ephemeral',
            grantedAt: new Date().toISOString()
        };
        await this.repository.set(key, status);
        return {
            type: 'ephemeral-confirmed',
            status,
            message: 'Ephemeral access granted. Your messages in this chat will be parsed until consent is revoked.'
        };
    }
    async handleRevoke(key) {
        const existing = await this.repository.get(key);
        if (!existing) {
            return {
                type: 'denied',
                message: 'No consent found for this chat. Nothing to revoke.'
            };
        }
        await this.repository.delete(key);
        return {
            type: 'revoked',
            message: 'Consent revoked. Messages will no longer be parsed until access is granted again.'
        };
    }
    async ensureAuthorized(key) {
        const existing = await this.repository.get(key);
        if (!existing) {
            return {
                type: 'denied',
                message: 'This chat is not authorized. Send "connect <username> <otp>" to link your account or reply "yes" for temporary parsing.'
            };
        }
        return { type: 'allowed', status: existing };
    }
    getSessionKey(channel, author) {
        const safeChannel = channel?.trim() || 'default';
        const safeAuthor = author?.trim() || 'anonymous';
        return `${safeChannel}::${safeAuthor}`;
    }
}
exports.ConsentService = ConsentService;
//# sourceMappingURL=consentService.js.map