import { Router } from 'express';
import { isValidId } from '../middlewares/isValidId.js';
import * as contactsController from '../controllers/contactsController.js';

import { ctrlWrapper } from '../utils/ctrlWrapper.js';

import { validateBody } from '../utils/validateBody.js';

import {
  contactAddSchema,
  contactUpdateSchema,
} from '../validation/contactVal.js';

import { upload } from '../middlewares/upload.js';

import { authenticate } from '../middlewares/authenticate.js';

const contactsRouter = Router();

contactsRouter.use(authenticate);

contactsRouter.get('/', ctrlWrapper(contactsController.getContactsController));

contactsRouter.get(
  '/:id',
  isValidId,
  ctrlWrapper(contactsController.getcontactByIdController),
);

contactsRouter.post(
  '/',
  upload.single('photo'),
  validateBody(contactAddSchema),
  ctrlWrapper(contactsController.addContactController),
);

contactsRouter.put(
  '/:id',
  upload.single('photo'),
  isValidId,
  validateBody(contactAddSchema),
  ctrlWrapper(contactsController.upsertContactController),
);

contactsRouter.patch(
  '/:id',
  isValidId,
  upload.single('photo'),
  validateBody(contactUpdateSchema),
  ctrlWrapper(contactsController.patchContactController),
);

contactsRouter.delete(
  '/:id',
  isValidId,
  ctrlWrapper(contactsController.deleteContactController),
);

export default contactsRouter;
