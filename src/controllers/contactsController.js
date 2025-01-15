import * as contactServices from '../services/contactsSer.js';

import createHttpError from 'http-errors';

import { parsePaginationParams } from '../utils/parsePaginationParams.js';

import { parseSortParams } from '../utils/parseSortParams.js';

import { sortByList } from '../db/models/Contact.js';
import { parseFilterParams } from '../utils/parseFilterParams.js';
import { saveFileToUploadsDir } from '../utils/saveFileToUploadsDir.js';
import { getEnvVar } from '../utils/getEnvVar.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

export const getContactsController = async (req, res) => {
  const { page, perPage } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams(req.query, sortByList);
  const filter = parseFilterParams(req.query);
  filter.userId = req.user._id;

  const data = await contactServices.getContacts({
    page,
    perPage,
    sortBy,
    sortOrder,
    filter,
  });
  res.json({
    status: 200,
    message: 'Successfully found movies',
    data,
  });
};

export const getcontactByIdController = async (req, res) => {
  const { _id: userId } = req.user;
  const { id: _id } = req.params;
  const data = await contactServices.getContactById({ _id, userId });
  if (!data) {
    throw createHttpError(404, `Contact with id=${_id} not found`);
  }
  res.json({
    status: 200,
    message: `Successfully find contact with id=${_id}`,
    data,
  });
};

export const addContactController = async (req, res) => {
  let photo;
  if (req.file) {
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photo = await saveFileToCloudinary(req.file);
    } else {
      photo = await saveFileToUploadsDir(req.file);
    }
  }
  const { _id: userId } = req.user;
  const data = await contactServices.addContact({
    ...req.body,
    photo,
    userId,
  });
  res.status(201).json({
    status: 201,
    message: 'Successfully add contact',
    data,
  });
};

export const upsertContactController = async (req, res) => {
  const { id } = req.params;
  const { _id: userId } = req.user;
  const { isNew, data } = await contactServices.updateContact(
    id,
    { ...req.body, userId },
    {
      upsert: true,
    },
  );
  const status = isNew ? 201 : 200;
  res.status(status).json({
    status,
    message: 'Successfully upsert contact',
    data,
  });
};

export const patchContactController = async (req, res) => {
  let photo;
  if (req.file) {
    if (getEnvVar('ENABLE_CLOUDINARY') === 'true') {
      photo = await saveFileToCloudinary(req.file);
    } else {
      photo = await saveFileToUploadsDir(req.file);
    }
  }
  const { _id: userId } = req.user;
  const { id: _id } = req.params;
  const result = await contactServices.updateContact(
    { _id, userId, photo },
    req.body,
  );

  if (!result) {
    throw createHttpError(404, 'Contact not found');
  }

  res.json({
    status: 200,
    message: 'Successfully insert contact',
    data: result.data,
  });
};

export const deleteContactController = async (req, res) => {
  const { _id: userId } = req.user;
  const { id: _id } = req.params;
  const data = await contactServices.deleteContact({ _id, userId });
  if (!data) {
    throw createHttpError(404, 'Contact not found');
  }
  res.status(204).send();
};
