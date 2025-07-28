import { config } from 'dotenv';

// Load .env file
config({override: true});

export const PORT = process.env.PORT ?? 3000;
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const DATABASE_URL = process.env.DATABASE_URL;

// JWT Configuration
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN;

// Validate required environment variables
if (!DATABASE_URL) {
  throw new Error('⛔ DATABASE_URL is missing. Please define it in your .env file.');
}
if (!JWT_SECRET) {
  throw new Error('⛔ JWT_SECRET is missing. Please define it in your .env file.');
}
if (!JWT_REFRESH_SECRET) {
  throw new Error('⛔ JWT_REFRESH_SECRET is missing. Please define it in your .env file.');
}



