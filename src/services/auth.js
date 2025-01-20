import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import path from 'node:path';
import jwt from 'jsonwebtoken';

import UserCollection from '../db/models/User.js';
import SessionCollection from '../db/models/Session.js';
import { sendEmail } from '../utils/sendEmail.js';
import { TEMPLATES_DIR } from '../constants/index.js';
import { SMTP } from '../constants/index.js';

import {
  accessTokenLifetime,
  refreshTokenLifetime,
} from '../constants/users.js';
import fs from 'node:fs/promises';

import Handlebars from 'handlebars';
import { getEnvVar } from '../utils/getEnvVar.js';

const emailTemplatePath = path.join(TEMPLATES_DIR, 'verify-email.html');

const emailTemplateSource = await fs.readFile(emailTemplatePath, 'utf-8');

const appDomain = getEnvVar('APP_DOMAIN');
const jwtSecret = getEnvVar('JWT_SECRET');

const createSessionData = () => ({
  accessToken: randomBytes(30).toString('base64'),
  refreshToken: randomBytes(30).toString('base64'),
  accessTokenValidUntil: Date.now() + accessTokenLifetime,
  refreshTokenValidUntil: Date.now() + refreshTokenLifetime,
});

export const register = async (paylod) => {
  const { email, password } = paylod;
  const user = await UserCollection.findOne({ email });
  if (user) {
    throw createHttpError(409, 'User already exist');
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await UserCollection.create({
    ...paylod,
    password: hashPassword,
  });

  const template = Handlebars.compile(emailTemplateSource);

  const token = jwt.sign({ email }, jwtSecret, { expiresIn: '1h' });
  const html = template({
    link: `${appDomain}/verify?token=${token}`,
  });

  const verifyEmail = {
    from: getEnvVar(SMTP.SMTP_FROM),
    to: email,
    subject: 'Varify email',
    html,
  };

  await sendEmail(verifyEmail);
  return newUser;
};

export const login = async ({ email, password }) => {
  const user = await UserCollection.findOne({ email });
  if (!user) {
    throw createHttpError(401, 'Email or password invalid');
  }

  const passordCoapere = await bcrypt.compare(password, user.password);
  if (!passordCoapere) {
    throw createHttpError(401, 'Email or password invalid');
  }

  await SessionCollection.deleteOne({ userId: user._id });

  const sessionData = createSessionData();

  return SessionCollection.create({
    userId: user._id,
    ...sessionData,
  });
};

export const refreshToken = async (paylod) => {
  const oldSession = await SessionCollection.findOne({
    _id: paylod.sessionId,
    refreshToken: paylod.refreshToken,
  });
  if (!oldSession) {
    throw createHttpError(401, 'Session not found');
  }
  if (Date.now() > oldSession.refreshTokenValidUntil) {
    throw createHttpError(401, 'Refresh token expired');
  }
  await SessionCollection.deleteOne({ _id: paylod.sessionId });

  const sessionData = createSessionData();

  return SessionCollection.create({
    userId: oldSession.userId,
    ...sessionData,
  });
};

export const logout = async (sessionId) => {
  await SessionCollection.deleteOne({ _id: sessionId });
};

export const getUser = (filter) => UserCollection.findOne(filter);

export const getSession = (filter) => SessionCollection.findOne(filter);

export const requestResetToken = async (email) => {
  const user = await UserCollection.findOne({ email });
  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const resetToken = jwt.sign(
    {
      sub: user._id,
      email,
    },
    getEnvVar('JWT_SECRET'),
    {
      expiresIn: '5m',
    },
  );

  const resetPasswordTemplatePath = path.join(
    TEMPLATES_DIR,
    'reset-password-email.html',
  );

  const templateSource = (
    await fs.readFile(resetPasswordTemplatePath)
  ).toString();

  const template = Handlebars.compile(templateSource);
  const html = template({
    name: user.name,
    link: `${getEnvVar('APP_DOMAIN')}/reset-password?token=${resetToken}`,
  });

  await sendEmail({
    from: getEnvVar(SMTP.SMTP_FROM),
    to: email,
    subject: 'Reset your password',
    html,
  });
};

export const resetPassword = async (payload) => {
  let entries;

  try {
    entries = jwt.verify(payload.token, getEnvVar('JWT_SECRET'));
  } catch (err) {
    if (err instanceof Error) throw createHttpError(401, err.message);
    throw err;
  }

  const user = await UserCollection.findOne({
    email: entries.email,
    _id: entries.sub,
  });

  if (!user) {
    throw createHttpError(404, 'User not found');
  }

  const encryptedPassword = await bcrypt.hash(payload.password, 10);

  await UserCollection.updateOne(
    { _id: user._id },
    { password: encryptedPassword },
  );
};
