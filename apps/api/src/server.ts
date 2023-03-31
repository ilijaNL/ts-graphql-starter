import fastify from 'fastify';
import closeWithGrace from 'close-with-grace';
import environment from './env';
import app, { options } from './app';

const IS_PROD = environment.NODE_ENV === 'production';

// Instantiate Fastify with some config
const server = fastify({
  logger: {
    level: IS_PROD ? 'error' : 'info',
  },
  ...options,
});

server.register(app);

const closeListeners = closeWithGrace({ delay: 5000 }, async ({ err }: any) => {
  if (err) {
    server.log.error(err);
  }

  server.log.info('closing api');

  await server.close();
});

server.addHook('onClose', async () => {
  closeListeners.uninstall();

  await new Promise((resolve) => setTimeout(resolve, 10));
});

// Start listening.
// use 0.0.0.0 for docker
server.listen(
  {
    // host: '0.0.0.0',
    port: +environment.PORT,
  },
  (err) => {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
  }
);
