import { ConsentStatus } from '../types/consent';
import { ConsentRepository } from '../repositories/consentRepository';
export type ConsentDecision = {
    type: 'allowed';
    status: ConsentStatus;
} | {
    type: 'link-confirmed';
    status: ConsentStatus;
    message: string;
} | {
    type: 'ephemeral-confirmed';
    status: ConsentStatus;
    message: string;
} | {
    type: 'revoked';
    message: string;
} | {
    type: 'denied';
    message: string;
};
export declare class ConsentService {
    private readonly repository;
    private readonly otpDirectory;
    private readonly userRepository;
    constructor(repository?: ConsentRepository, directory?: {
        username: string;
        otp: string;
        userId?: string | undefined;
    }[]);
    handleMessage(channel: string | undefined, author: string | undefined, message: string): Promise<ConsentDecision>;
    private handleLinkCommand;
    private handleEphemeralConsent;
    private handleRevoke;
    private ensureAuthorized;
    private getSessionKey;
}
