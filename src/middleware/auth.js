import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized', requestId: req.id });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized', requestId: req.id });
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token', requestId: req.id });
  }

  const user = await User.findByPk(payload.id);
  if (!user || !user.is_active) {
    return res.status(401).json({ success: false, message: 'Unauthorized', requestId: req.id });
  }

  req.user = user;
  return next();
};

// Backward-compatible alias for existing routes
export const authenticate = authenticateToken;
