export interface ConnectedService {
    name: string;
    connectedAt: string;
}
export interface UserRecord {
    id: string;
    username: string;
    email: string;
    otp: string;
    registeredAt: string;
    services: ConnectedService[];
}
export declare class UserRepository {
    registerUser(username: string, email: string): Promise<UserRecord>;
    findByUsername(username: string): Promise<UserRecord | undefined>;
    connectService(username: string, serviceName: string): Promise<UserRecord | undefined>;
    persist(user: UserRecord): Promise<void>;
    private generateOtp;
}
