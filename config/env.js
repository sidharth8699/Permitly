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
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
export const EMAIL_HOST = process.env.EMAIL_HOST;
export const EMAIL_PORT = process.env.EMAIL_PORT;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_SECURE = process.env.EMAIL_SECURE;
export const BACKEND_URL = process.env.BACKEND_URL;

// AWS Configuration
export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
export const AWS_REGION = process.env.AWS_REGION;
export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET;
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

// Validate AWS S3 configuration
if (!AWS_ACCESS_KEY_ID) {
  throw new Error('⛔ AWS_ACCESS_KEY_ID is missing. Please define it in your .env file.');
}
if (!AWS_SECRET_ACCESS_KEY) {
  throw new Error('⛔ AWS_SECRET_ACCESS_KEY is missing. Please define it in your .env file.');
}
if (!AWS_REGION) {
  throw new Error('⛔ AWS_REGION is missing. Please define it in your .env file.');
}
if (!AWS_S3_BUCKET) {
  throw new Error('⛔ AWS_S3_BUCKET is missing. Please define it in your .env file.');
}

// Validate email configuration
if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
  throw new Error('⛔ Email configuration is incomplete. Please check your .env file.');
}
