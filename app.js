import express from 'express';
import { PORT } from './config/env.js';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.send('Welcome to Permitly Backend!');
});

app.listen(PORT,()=>{
  console.log(`subscription tracker API is running on http://localhost:${PORT}`);

//   await connectToDatabase();
});

export default app;
// This is the main entry point for the Permitly backend application.

