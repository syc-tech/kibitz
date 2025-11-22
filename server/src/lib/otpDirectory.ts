import { z } from 'zod';

const otpEntrySchema = z.object({
  username: z.string().min(1),
  otp: z.string().min(1),
  userId: z.string().optional()
});

const directorySchema = z.array(otpEntrySchema);

export type OtpDirectoryEntry = z.infer<typeof otpEntrySchema>;

const DEFAULT_DIRECTORY: OtpDirectoryEntry[] = [
  { username: 'demo', otp: '123456', userId: 'user-demo' },
  { username: 'aimee', otp: '654321', userId: 'user-aimee' }
];

export function loadOtpDirectory(): OtpDirectoryEntry[] {
  const source = process.env.OTP_DIRECTORY;
  if (!source) {
    return DEFAULT_DIRECTORY;
  }

  try {
    const parsed = JSON.parse(source);
    return directorySchema.parse(parsed);
  } catch (error) {
    console.warn('Failed to parse OTP_DIRECTORY, using defaults', error);
    return DEFAULT_DIRECTORY;
  }
}

export function findDirectoryEntry(
  username: string,
  otp: string,
  directory: OtpDirectoryEntry[]
): OtpDirectoryEntry | undefined {
  const normalizedUsername = username.trim().toLowerCase();
  const normalizedOtp = otp.trim();
  return directory.find(
    (entry) => entry.username.toLowerCase() === normalizedUsername && entry.otp === normalizedOtp
  );
}
