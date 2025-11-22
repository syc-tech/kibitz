import { Express } from 'express';
import type { Server } from 'node:http';
export declare function createServer(): Promise<Express>;
export interface StartServerResult {
    app: Express;
    server: Server;
}
export declare function startHttpServer(port?: number): Promise<StartServerResult>;
