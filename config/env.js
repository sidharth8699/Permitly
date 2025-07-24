import {config} from 'dotenv';

const activeEnv = process.env.NODE_ENV ?? 'development';
config({ path: `.env.${activeEnv}.local` });

export const PORT     = process.env.PORT      ?? 3000; // meaning its coming from .env file
export const NODE_ENV = activeEnv;