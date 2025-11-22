"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const constants_1 = require("./config/constants");
const database_1 = require("./lib/database");
async function bootstrap() {
    await (0, database_1.ensureDatabase)();
    await (0, server_1.startHttpServer)(constants_1.DEFAULT_SERVER_PORT);
}
bootstrap().catch((error) => {
    console.error('Server failed to start', error);
    process.exitCode = 1;
});
//# sourceMappingURL=index.js.map