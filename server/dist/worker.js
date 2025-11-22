"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_1 = require("@temporalio/worker");
const node_http_1 = __importDefault(require("node:http"));
const messageActivities_1 = require("./activities/messageActivities");
const constants_1 = require("./config/constants");
const database_1 = require("./lib/database");
let lastStartupError;
async function runWorker() {
    const port = Number(process.env.PORT ?? 8080);
    let isReady = false;
    const server = node_http_1.default.createServer((_req, res) => {
        if (isReady) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        }
        else {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'initializing',
                error: lastStartupError?.message ?? 'waiting for database'
            }));
        }
    });
    server.listen(port, () => {
        console.log(`Worker health server listening on ${port}`);
    });
    try {
        await (0, database_1.ensureDatabase)();
        isReady = true;
    }
    catch (error) {
        lastStartupError = error;
        throw error;
    }
    const worker = await worker_1.Worker.create({
        workflowsPath: require.resolve('./workflows'),
        activities: messageActivities_1.activities,
        taskQueue: constants_1.TASK_QUEUE
    });
    await worker.run();
}
runWorker().catch((error) => {
    lastStartupError = error;
    console.error('Worker failed', error);
    process.exitCode = 1;
});
//# sourceMappingURL=worker.js.map