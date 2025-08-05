import nodemailer from 'nodemailer';
import { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, EMAIL_SECURE } from './env.js';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_SECURE === 'true', //  false for other ports
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD
    }
});
