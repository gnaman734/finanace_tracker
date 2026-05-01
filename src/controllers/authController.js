import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { sequelize, RefreshToken, User } from '../models/index.js';
import { seedDefaultCategories } from '../services/seedDefaultCategories.js';
import { asyncHandler } from '../utils/helpers.js';

const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const REFRESH_COOKIE_NAME = 'refreshToken';

const isProd = env.nodeEnv === 'production';

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: isProd
};

const tokenHash = (token) => crypto.createHash('sha256').update(token).digest('hex');

const signAccessToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN
  });

const signRefreshToken = (user) =>
  jwt.sign({ id: user.id }, env.jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });

const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const setRefreshCookie = (res, refreshToken) => {
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    ...refreshCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions);
};

const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  preferred_currency: user.preferred_currency
});

const issueTokensAndPersistRefresh = async (user, { transaction }) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  const expiresAt = addDays(new Date(), 7);

  await RefreshToken.create(
    {
      user_id: user.id,
      token_hash: tokenHash(refreshToken),
      expires_at: expiresAt
    },
    { transaction }
  );

  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ where: { email } });
  if (exists) {
    return res.status(409).json({ success: false, message: 'Email already registered', requestId: req.id });
  }

  const password_hash = await bcrypt.hash(password, 12);

  const { user, accessToken, refreshToken } = await sequelize.transaction(async (transaction) => {
    const createdUser = await User.create(
      {
        name,
        email,
        password_hash
      },
      { transaction }
    );

    await seedDefaultCategories(createdUser.id, { transaction });

    const tokens = await issueTokensAndPersistRefresh(createdUser, { transaction });

    return { user: createdUser, ...tokens };
  });

  setRefreshCookie(res, refreshToken);
  return res.status(201).json({ success: true, user: publicUser(user), accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ success: false, message: 'Invalid credentials', requestId: req.id });
  }
  if (!user.is_active) {
    return res.status(401).json({ success: false, message: 'Account disabled', requestId: req.id });
  }

  const { accessToken, refreshToken } = await sequelize.transaction(async (transaction) => {
    await user.update({ last_login: new Date() }, { transaction });
    return issueTokensAndPersistRefresh(user, { transaction });
  });

  setRefreshCookie(res, refreshToken);
  return res.json({ success: true, user: publicUser(user), accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!refreshToken) {
    return res.status(401).json({ success: false, message: 'Missing refresh token', requestId: req.id });
  }

  const existing = await RefreshToken.findOne({ where: { token_hash: tokenHash(refreshToken) } });
  if (!existing) {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, message: 'Invalid refresh token', requestId: req.id });
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwtRefreshSecret);
  } catch {
    await existing.destroy();
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, message: 'Expired refresh token', requestId: req.id });
  }

  if (!payload?.id || payload.id !== existing.user_id) {
    await existing.destroy();
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, message: 'Invalid refresh token', requestId: req.id });
  }

  const user = await User.findByPk(payload.id);
  if (!user || !user.is_active) {
    await existing.destroy();
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, message: 'Unauthorized', requestId: req.id });
  }

  const { accessToken, newRefreshToken } = await sequelize.transaction(async (transaction) => {
    await RefreshToken.destroy({ where: { id: existing.id }, transaction });
    const accessTokenInner = signAccessToken(user);
    const rotatedRefreshToken = signRefreshToken(user);
    await RefreshToken.create(
      {
        user_id: user.id,
        token_hash: tokenHash(rotatedRefreshToken),
        expires_at: addDays(new Date(), 7)
      },
      { transaction }
    );
    return { accessToken: accessTokenInner, newRefreshToken: rotatedRefreshToken };
  });

  setRefreshCookie(res, newRefreshToken);
  return res.json({ accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
  if (refreshToken) {
    await RefreshToken.destroy({ where: { token_hash: tokenHash(refreshToken) } });
  }
  clearRefreshCookie(res);
  return res.json({ success: true });
});

export const googleCallback = asyncHandler(async (req, res) => {
  const user = req.user;
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await RefreshToken.create({
    user_id: user.id,
    token_hash: tokenHash(refreshToken),
    expires_at: addDays(new Date(), 7)
  });

  setRefreshCookie(res, refreshToken);
  return res.redirect(`${env.frontendUrl.replace(/\/$/, '')}/auth-callback?token=${accessToken}`);
});

export const me = asyncHandler(async (req, res) => {
  const user = req.user;
  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    preferred_currency: user.preferred_currency,
    created_at: user.createdAt
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const { name, preferred_currency, avatar_url } = req.body;

  const updates = {};
  if (typeof name === 'string') updates.name = name;
  if (typeof preferred_currency === 'string') updates.preferred_currency = preferred_currency;
  if (typeof avatar_url === 'string' || avatar_url === null) updates.avatar_url = avatar_url;

  const updated = await req.user.update(updates);
  return res.json({ success: true, user: publicUser(updated) });
});

export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = req.user;

  if (!user.password_hash) {
    return res.status(400).json({ success: false, message: 'Password not set for this account', requestId: req.id });
  }

  const ok = await bcrypt.compare(currentPassword, user.password_hash);
  if (!ok) {
    return res.status(401).json({ success: false, message: 'Invalid current password', requestId: req.id });
  }

  const password_hash = await bcrypt.hash(newPassword, 12);
  await user.update({ password_hash });

  await RefreshToken.destroy({ where: { user_id: user.id } });
  clearRefreshCookie(res);

  return res.json({ success: true });
});
