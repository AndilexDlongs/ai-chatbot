import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, '..', '..', 'public', 'pages');

router.get('/', (req, res) => {
  res.sendFile(path.join(pagesDir, 'landing.html'));
});

router.get('/chat', (req, res) => {
  res.sendFile(path.join(pagesDir, 'chat.html'));
});

router.get('/pricing', (req, res) => {
  res.sendFile(path.join(pagesDir, 'pricing.html'));
});

router.get('/checkout', (req, res) => {
  res.sendFile(path.join(pagesDir, 'checkout.html'));
});

export default router;
