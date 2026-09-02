const path = require('path');
const express = require('express');
const { buildVerificationHash, verifyPurchaseResponse } = require('./hmac');
const { handleWebhook } = require('./webhook');

// Replace these with your ArtsPay sandbox credentials. You can also set
// them as FZ_USERNAME / FZ_SHARED_SECRET environment variables instead of
// editing this file, if you prefer.
const FZ_USERNAME = process.env.FZ_USERNAME || '';
const FZ_SHARED_SECRET = process.env.FZ_SHARED_SECRET || '';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const HPP_BASE_URL = 'https://paynow.pmnts-sandbox.io/v3';

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

// Returns a Hosted Payment Page URL for embedding in an iframe. Uses
// iframe=true&postmessage=true, not a redirect: the hosted page posts the
// result back to the parent window instead of navigating away.
app.get('/api/checkout-url', (req, res) => {
  if (!FZ_USERNAME || !FZ_SHARED_SECRET) {
    return res.status(500).json({ error: 'Set FZ_USERNAME and FZ_SHARED_SECRET in server.js first.' });
  }

  const amount = typeof req.query.amount === 'string' && AMOUNT_PATTERN.test(req.query.amount)
    ? req.query.amount
    : '10.25';
  const reference = `order_${Date.now()}`;
  const currency = 'AUD';

  const hash = buildVerificationHash(FZ_SHARED_SECRET, { reference, amount, currency });
  const url = `${HPP_BASE_URL}/${FZ_USERNAME}/${reference}/${currency}/${amount}/${hash}?iframe=true&postmessage=true`;

  res.json({ url });
});

// The postMessage payload is untrusted until this endpoint verifies it: the
// shared secret needed to check it never reaches the browser.
app.post('/api/verify', (req, res) => {
  const { r, successful, amount, currency, id, token, v } = req.body ?? {};
  const verified = verifyPurchaseResponse(FZ_SHARED_SECRET, {
    responseCode: r, successful, amount, currency, id, token, verification: v,
  });

  res.json({ verified });
});

// Optional: see webhook.js. Adjust the path to whatever your own webhook
// URL should be, or remove this line entirely if you don't need webhooks.
app.post('/webhooks', handleWebhook);

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
