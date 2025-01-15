import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'node:fs/promises';

import { getEnvVar } from './getEnvVar.js';
import { CLOUDINARY } from '../constants/index.js';

cloudinary.config({
  secure: true,
  cloud_name: getEnvVar(CLOUDINARY.CLOUD_NAME),
  api_key: getEnvVar(CLOUDINARY.API_KEY),
  api_secret: getEnvVar(CLOUDINARY.API_SECRET),
});

export const saveFileToCloudinary = async (file) => {
  const response = await cloudinary.uploader.upload(file.path, {
    folder: 'photo',
  });
  await fs.unlink(file.path);
  return response.secure_url;
};
