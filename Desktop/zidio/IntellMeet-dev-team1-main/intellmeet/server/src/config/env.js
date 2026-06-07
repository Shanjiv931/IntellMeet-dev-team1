import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables from server/.env during local development
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const requiredEnv = [
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'CLIENT_URL'
];

const missingEnv = requiredEnv.filter((env) => !process.env[env]);

if (missingEnv.length > 0) {
  const errorMsg = `CRITICAL CONFIGURATION ERROR: Missing required environment variables: [${missingEnv.join(', ')}]. Server execution halted.`;
  console.error('\x1b[31m%s\x1b[0m', errorMsg);
  process.exit(1);
}

// Additional validations
if (process.env.JWT_SECRET.length < 32) {
  console.warn('\x1b[33m%s\x1b[0m', 'SECURITY WARNING: JWT_SECRET is less than 32 characters long. Ensure strong secret generation in production.');
}
if (process.env.JWT_REFRESH_SECRET.length < 32) {
  console.warn('\x1b[33m%s\x1b[0m', 'SECURITY WARNING: JWT_REFRESH_SECRET is less than 32 characters long. Ensure strong secret generation in production.');
}

const env = Object.freeze({
  PORT: parseInt(process.env.PORT || '8080', 10),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
  NODE_ENV: process.env.NODE_ENV || 'development'
});

export default env;
