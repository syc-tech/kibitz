import { z } from 'zod';
declare const otpEntrySchema: z.ZodObject<{
    username: z.ZodString;
    otp: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    username: string;
    otp: string;
    userId?: string | undefined;
}, {
    username: string;
    otp: string;
    userId?: string | undefined;
}>;
export type OtpDirectoryEntry = z.infer<typeof otpEntrySchema>;
export declare function loadOtpDirectory(): OtpDirectoryEntry[];
export declare function findDirectoryEntry(username: string, otp: string, directory: OtpDirectoryEntry[]): OtpDirectoryEntry | undefined;
export {};
