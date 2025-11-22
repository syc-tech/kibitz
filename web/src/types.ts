export interface ConnectedService {
  name: string;
  connectedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  otp?: string;
  services: ConnectedService[];
}

export interface ChatParticipant {
  key: string;
  authorId: string;
  username?: string;
  consentType: 'linked' | 'ephemeral';
  lastSeenAt: string;
}

export interface ChatRecord {
  id: string;
  channel: string;
  participants: ChatParticipant[];
  sharedGroupId: string;
  pendingLinkGroupId?: string;
  pendingLinkTargetId?: string;
  pendingApprovals: string[];
}

export interface MessageRecord {
  id: string;
  chatId: string;
  sharedGroupId: string;
  authorId: string;
  authorKey: string;
  originalMessage: string;
  renderedMessage: string;
  postedAt: string;
  channel?: string;
}
