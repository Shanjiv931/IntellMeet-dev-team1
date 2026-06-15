import * as Sentry from "@sentry/node";
import logger from '../utils/logger.js';

const dsn = process.env.SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 1.0,
  });
  logger.info("Sentry monitoring initialized successfully.");
} else {
  logger.warn("SENTRY_DSN is not defined in the environment. Sentry monitoring is disabled.");
}
