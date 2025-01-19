import express from 'express';
import cors from 'cors';
//import { logger } from './middlewares/logger.js';
import contactsRouter from './routers/contactsRouter.js';

import cookieParser from 'cookie-parser';

import { getEnvVar } from './utils/getEnvVar.js';
import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { swaggerDocs } from './middlewares/swaggerDocs.js';

import authRoutr from './routers/auth.js';
//import { UPLOADS_DIR } from './constants/index.js';

export const setupServer = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static('uploads'));
  app.use(cookieParser());
  // app.use(logger);

  app.use('/auth', authRoutr);
  app.use('/contacts', contactsRouter);
  app.use('/api-docs', swaggerDocs());
  //app.use('/uploads', express.static(UPLOADS_DIR));

  app.use(notFoundHandler);

  app.use(errorHandler);

  const port = Number(getEnvVar('PORT', 3000));

  app.listen(port, () => console.log(`Server running on ${port} port`));
};
