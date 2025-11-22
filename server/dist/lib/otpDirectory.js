"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadOtpDirectory = loadOtpDirectory;
exports.findDirectoryEntry = findDirectoryEntry;
const zod_1 = require("zod");
const otpEntrySchema = zod_1.z.object({
    username: zod_1.z.string().min(1),
    otp: zod_1.z.string().min(1),
    userId: zod_1.z.string().optional()
});
const directorySchema = zod_1.z.array(otpEntrySchema);
const DEFAULT_DIRECTORY = [
    { username: 'demo', otp: '123456', userId: 'user-demo' },
    { username: 'aimee', otp: '654321', userId: 'user-aimee' }
];
function loadOtpDirectory() {
    const source = process.env.OTP_DIRECTORY;
    if (!source) {
        return DEFAULT_DIRECTORY;
    }
    try {
        const parsed = JSON.parse(source);
        return directorySchema.parse(parsed);
    }
    catch (error) {
        console.warn('Failed to parse OTP_DIRECTORY, using defaults', error);
        return DEFAULT_DIRECTORY;
    }
}
function findDirectoryEntry(username, otp, directory) {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedOtp = otp.trim();
    return directory.find((entry) => entry.username.toLowerCase() === normalizedUsername && entry.otp === normalizedOtp);
}
//# sourceMappingURL=otpDirectory.js.map