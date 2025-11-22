import { Worker } from '@temporalio/worker';
import { activities } from './activities/messageActivities';
import { TASK_QUEUE } from './config/constants';
import { ensureDatabase } from './lib/database';

async function runWorker() {
  await ensureDatabase();
  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: TASK_QUEUE
  });

  await worker.run();
}

runWorker().catch((error) => {
  console.error('Worker failed', error);
  process.exitCode = 1;
});
