export interface LinkedConsent {
    type: 'linked';
    username: string;
    userId: string;
    linkedAt: string;
}
export interface EphemeralConsent {
    type: 'ephemeral';
    grantedAt: string;
}
export type ConsentStatus = LinkedConsent | EphemeralConsent;
