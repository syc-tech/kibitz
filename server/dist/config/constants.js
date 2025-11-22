"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SERVER_PORT = exports.TASK_QUEUE = void 0;
exports.TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE ?? 'message-processing';
exports.DEFAULT_SERVER_PORT = Number(process.env.PORT ?? 4000);
//# sourceMappingURL=constants.js.map