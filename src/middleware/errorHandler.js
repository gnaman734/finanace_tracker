import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
    requestId: req.id
  };

  if (err.errors) response.errors = err.errors;
  if (process.env.NODE_ENV === 'development') response.stack = err.stack;

  logger.error('request_failed', {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    message: err.message,
    stack: err.stack
  });

  res.status(statusCode).json(response);
};
