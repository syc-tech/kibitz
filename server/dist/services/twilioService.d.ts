export declare class TwilioService {
    private readonly client;
    private readonly chatRepository;
    constructor();
    sendMessage(channel: string | undefined, body: string): Promise<void>;
}
