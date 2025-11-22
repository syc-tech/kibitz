import { ConsentStatus } from '../types/consent';
import { findDirectoryEntry, loadOtpDirectory, OtpDirectoryEntry } from '../lib/otpDirectory';
import { ConsentRepository } from '../repositories/consentRepository';
import { UserRepository } from '../repositories/userRepository';

const LINK_PATTERN = /^(?:link|connect)\s+(\S+)\s+(\S+)$/i;
const YES_PATTERN = /^\s*yes\s*$/i;
const REVOKE_PATTERN = /^(?:revoke|unlink)\s*$/i;

export type ConsentDecision =
  | { type: 'allowed'; status: ConsentStatus }
  | { type: 'link-confirmed'; status: ConsentStatus; message: string }
  | { type: 'ephemeral-confirmed'; status: ConsentStatus; message: string }
  | { type: 'revoked'; message: string }
  | { type: 'denied'; message: string };

export class ConsentService {
  private readonly otpDirectory: OtpDirectoryEntry[];
  private readonly userRepository = new UserRepository();

  constructor(
    private readonly repository = new ConsentRepository(),
    directory = loadOtpDirectory()
  ) {
    this.otpDirectory = directory;
  }

  async handleMessage(
    channel: string | undefined,
    author: string | undefined,
    message: string
  ): Promise<ConsentDecision> {
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

  private async handleLinkCommand(key: string, username: string, otp: string): Promise<ConsentDecision> {
    const user = await this.userRepository.findByUsername(username);
    if (user && user.otp === otp) {
      const status: ConsentStatus = {
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

    const entry = findDirectoryEntry(username, otp, this.otpDirectory);
    if (!entry) {
      return {
        type: 'denied',
        message: 'Invalid username or OTP. Please try again or reply "yes" to grant temporary parsing.'
      };
    }

    const status: ConsentStatus = {
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

  private async handleEphemeralConsent(key: string): Promise<ConsentDecision> {
    const status: ConsentStatus = {
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

  private async handleRevoke(key: string): Promise<ConsentDecision> {
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

  private async ensureAuthorized(key: string): Promise<ConsentDecision> {
    const existing = await this.repository.get(key);
    if (!existing) {
      return {
        type: 'denied',
        message:
          'This chat is not authorized. Send "connect <username> <otp>" to link your account or reply "yes" for temporary parsing.'
      };
    }

    return { type: 'allowed', status: existing };
  }

  private getSessionKey(channel?: string, author?: string): string {
    const safeChannel = channel?.trim() || 'default';
    const safeAuthor = author?.trim() || 'anonymous';
    return `${safeChannel}::${safeAuthor}`;
  }
}
