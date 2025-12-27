import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAuth } from '../controllers/auth.controller.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesDir = path.join(__dirname, '..', '..', 'public', 'pages');

router.get('/', (req, res) => {
  res.sendFile(path.join(pagesDir, 'landing.html'));
});

router.get('/chat', requireAuth, (req, res) => {
  res.render('chat/index');
});

// Normalize signup/subscribe to login
router.get('/signup', (req, res) => res.redirect('/login?tier=free'));
router.get('/subscribe', (req, res) => res.redirect('/login?tier=pro'));

router.get('/pricing', (req, res) => {
  res.sendFile(path.join(pagesDir, 'pricing.html'));
});

router.get('/checkout', (req, res) => {
  res.sendFile(path.join(pagesDir, 'checkout.html'));
});

export default router;
