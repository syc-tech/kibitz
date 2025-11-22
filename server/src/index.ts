import { startHttpServer } from './server';
import { DEFAULT_SERVER_PORT } from './config/constants';
import { ensureDatabase } from './lib/database';

async function bootstrap() {
  await ensureDatabase();
  await startHttpServer(DEFAULT_SERVER_PORT);
}

bootstrap().catch((error) => {
  console.error('Server failed to start', error);
  process.exitCode = 1;
});
