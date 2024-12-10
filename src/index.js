import { setupServer } from './server.js';
import { initMongoConnection } from './db/initMongoDB.js';

const boostrap = async () => {
  await initMongoConnection();
  setupServer();
};

boostrap();
