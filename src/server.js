import { app } from './app.js';
import { connectDB } from './config/db.js';
import { sequelize } from './models/index.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const start = async () => {
  try {
    await connectDB();
    await sequelize.sync();
    app.listen(env.port, () => {
      logger.info(`Server started on port ${env.port}`);
    });
  } catch (error) {
    logger.error('server_start_failed', { message: error.message, stack: error.stack });
    process.exit(1);
  }
};

start();
