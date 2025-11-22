export const TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE ?? 'message-processing';
export const DEFAULT_SERVER_PORT = Number(process.env.PORT ?? 4000);
