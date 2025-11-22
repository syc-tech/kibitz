import { Worker } from '@temporalio/worker';
import http from 'node:http';
import { activities } from './activities/messageActivities';
import { TASK_QUEUE } from './config/constants';
import { ensureDatabase } from './lib/database';

let lastStartupError: Error | undefined;

async function runWorker() {
  const port = Number(process.env.PORT ?? 8080);
  let isReady = false;
  const server = http.createServer((_req, res) => {
    if (isReady) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'initializing',
          error: lastStartupError?.message ?? 'waiting for database'
        })
      );
    }
  });
  server.listen(port, () => {
    console.log(`Worker health server listening on ${port}`);
  });

  try {
    await ensureDatabase();
    isReady = true;
  } catch (error) {
    lastStartupError = error as Error;
    throw error;
  }

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: TASK_QUEUE
  });

  await worker.run();
}

runWorker().catch((error) => {
  lastStartupError = error as Error;
  console.error('Worker failed', error);
  process.exitCode = 1;
});
