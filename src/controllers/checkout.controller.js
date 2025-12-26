import { createTransaction, handleWebhook } from '../integrations/paddle.js';

export async function createCheckout(req, res) {
  try {
    const { priceId, userId, email } = req.body;
    const url = await createTransaction(priceId, userId, email);
    res.json({ url });
  } catch (err) {
    console.error('❌ Error creating checkout:', err);
    res.status(500).json({ error: err.message });
  }
}

// Keep your existing handler shape
export const paddleWebhook = handleWebhook;
