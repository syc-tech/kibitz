"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_1 = require("@temporalio/worker");
const messageActivities_1 = require("./activities/messageActivities");
const constants_1 = require("./config/constants");
const database_1 = require("./lib/database");
async function runWorker() {
    await (0, database_1.ensureDatabase)();
    const worker = await worker_1.Worker.create({
        workflowsPath: require.resolve('./workflows'),
        activities: messageActivities_1.activities,
        taskQueue: constants_1.TASK_QUEUE
    });
    await worker.run();
}
runWorker().catch((error) => {
    console.error('Worker failed', error);
    process.exitCode = 1;
});
//# sourceMappingURL=worker.js.map