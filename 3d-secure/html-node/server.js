const path = require('path');
const express = require('express');
const { buildPaymentIntentVerification } = require('./payment-intent');
const { verifyPaymentResult } = require('./payment-result');

// Set FZ_USERNAME / FZ_SHARED_SECRET / FZ_OAUTH_ACCESS_KEY /
// FZ_OAUTH_ACCESS_SECRET as environment variables. The username is your
// ArtsPay merchant username; the shared secret is the same "Pay Now token"
// used to sign Hosted Payment Page URLs elsewhere in this repo, needed here
// to sign the PaymentIntent instead; the OAuth access key/secret come from
// a one-off download in the Merchant Dashboard (Settings -> OAuth Clients
// -> Create new OAuth Client) and are used only server-side to mint
// short-lived access tokens. Never hardcode real credentials here or
// commit them to a repository.
const FZ_USERNAME = process.env.FZ_USERNAME || '';
const FZ_SHARED_SECRET = process.env.FZ_SHARED_SECRET || '';
const FZ_OAUTH_ACCESS_KEY = process.env.FZ_OAUTH_ACCESS_KEY || '';
const FZ_OAUTH_ACCESS_SECRET = process.env.FZ_OAUTH_ACCESS_SECRET || '';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const OAUTH_HOST = 'https://api.pmnts-sandbox.io';
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

// fatzebra.js needs a fresh OAuth token (15-minute expiry) before it can run
// a 3DS2 check, so the frontend fetches this once per checkout rather than
// reusing one across sessions. The access key/secret used to mint it never
// reach the browser, only the resulting short-lived token does.
app.get('/api/checkout-config', async (req, res) => {
  if (!FZ_USERNAME || !FZ_SHARED_SECRET || !FZ_OAUTH_ACCESS_KEY || !FZ_OAUTH_ACCESS_SECRET) {
    return res.status(500).json({
      error: 'Set FZ_USERNAME, FZ_SHARED_SECRET, FZ_OAUTH_ACCESS_KEY and FZ_OAUTH_ACCESS_SECRET in server.js first.',
    });
  }

  const rawAmount = req.query.amount;
  const amount = typeof rawAmount === 'string' && AMOUNT_PATTERN.test(rawAmount) ? rawAmount : '5.00';
  const amountCents = Math.round(Number(amount) * 100);

  const tokenRes = await fetch(`${OAUTH_HOST}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_key: FZ_OAUTH_ACCESS_KEY, access_secret: FZ_OAUTH_ACCESS_SECRET }),
  });
  const tokenBody = await tokenRes.json();
  const accessToken = tokenBody?.data?.token;
  if (!tokenRes.ok || !accessToken) {
    return res.status(502).json({ error: 'Failed to obtain an OAuth access token', details: tokenBody });
  }

  const reference = `order_${Date.now()}`;
  const currency = 'AUD';
  const verification = buildPaymentIntentVerification(FZ_SHARED_SECRET, { reference, amountCents, currency });

  res.json({ username: FZ_USERNAME, accessToken, amountCents, currency, reference, verification });
});

// fz.payment.success/fz.payment.error's own verification hash is untrusted
// until this endpoint confirms it: the shared secret needed to check it
// never reaches the browser.
app.post('/api/verify-payment-result', (req, res) => {
  const data = req.body ?? {};
  const verified = verifyPaymentResult(FZ_SHARED_SECRET, data);
  res.json({ verified });
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
