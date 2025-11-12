// src/frontend/js/pricing.js

// ---------- Paddle Initialization ----------
Paddle.Initialize({
  token: 'TEST_OR_LIVE_CLIENT_SIDE_TOKEN', // test_* for Sandbox, live_* for Prod
});
// Paddle.Environment.set('sandbox')  // enable in dev only

// ---------- Price IDs ----------
const PRICE_ID_9 = 'pri_your_starter_9_id';
const PRICE_ID_19 = 'pri_your_pro_19_id';

// Example user object (from your auth system)
const currentUser = { id: 'USER_ID_123', email: 'user@example.com' };

// ---------- Modal Checkout ----------
function openCheckout(priceId) {
  Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: { email: currentUser.email },
    customData: { userId: currentUser.id, plan: priceId },
    successUrl: 'https://app.unisyn.ai/billing/success',
    cancelUrl: 'https://app.unisyn.ai/billing/cancel',
  });
}

// ---------- Inline Checkout ----------
function openInlineCheckout(priceId) {
  const inlineSection = document.getElementById('inlineContainer');
  inlineSection.classList.remove('hidden');

  Paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: { email: currentUser.email },
    customData: { userId: currentUser.id, plan: priceId },
    settings: { displayMode: 'inline', theme: 'dark' },
    element: '#paddle-inline',
  });
}

// ---------- Button Listeners ----------
document
  .getElementById('btn-9')
  .addEventListener('click', () => openCheckout(PRICE_ID_9));

document
  .getElementById('btn-19')
  .addEventListener('click', () => openCheckout(PRICE_ID_19));

// Example: uncomment to use inline checkout by default
// openInlineCheckout(PRICE_ID_9)
