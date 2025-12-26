import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pagesRouter from './routes/pages.routes.js';
import apiRouter from './routes/api.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const PORT = process.env.PORT || 8787;

// Serve all frontend files
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Page routes (/chat, /pricing etc.)
app.use('/', pagesRouter);

// API routes (/api/*)
app.use('/api', apiRouter);

// Basic 404
app.use((req, res) => res.status(404).send('Not found'));

app.listen(PORT, () => {
  console.log(`✅ App running at http://localhost:${PORT}`);
  console.log(`🌐 Landing  → http://localhost:${PORT}/`);
  console.log(`💬 Chat     → http://localhost:${PORT}/chat`);
  console.log(`💵 Pricing  → http://localhost:${PORT}/pricing`);
  console.log(`🧾 Checkout → http://localhost:${PORT}/checkout`);
});
