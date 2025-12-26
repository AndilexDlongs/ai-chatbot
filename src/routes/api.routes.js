import express from 'express';
import { chatProxy } from '../controllers/chat.controller.js';
import { createCheckout, paddleWebhook } from '../controllers/checkout.controller.js';

const router = express.Router();

router.post('/chat', chatProxy);
router.post('/create-checkout', createCheckout);
router.post('/webhook', paddleWebhook);

export default router;
