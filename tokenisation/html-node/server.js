const path = require('path');
const express = require('express');
const { buildVerificationHash, verifyTokenizeResponse } = require('./hmac');

// Set FZ_USERNAME / FZ_SHARED_SECRET / FZ_TOKEN as environment variables to
// your ArtsPay sandbox credentials. The shared secret signs the Hosted
// Payment Page save-a-card request; the API token is a separate credential
// used for HTTP Basic Auth when charging a stored token directly. Never
// hardcode real credentials here or commit them to a repository.
const FZ_USERNAME = process.env.FZ_USERNAME || '';
const FZ_SHARED_SECRET = process.env.FZ_SHARED_SECRET || '';
const FZ_TOKEN = process.env.FZ_TOKEN || '';

const app = express();
// Fat Zebra requires customer_ip on every direct purchase call; behind a
// proxy/load balancer the real client IP is in X-Forwarded-For, not the
// socket address.
app.set('trust proxy', true);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const HPP_BASE_URL = 'https://paynow.pmnts-sandbox.io/v3';
const GATEWAY_HOST = 'https://gateway.pmnts-sandbox.io';

function basicAuthHeader() {
  return 'Basic ' + Buffer.from(`${FZ_USERNAME}:${FZ_TOKEN}`).toString('base64');
}

// ── Save a card (tokenize only, no charge) ──────────────────────────────
// Same iframe + postMessage pattern as the Hosted Payment Pages example,
// with tokenize_only=true so the card is stored but never charged. See
// https://artspay.com/docs/guides/hosted-payment-pages for that base pattern.

// The nominal amount shown on the hosted page during tokenize-only mode is
// never actually captured.
app.get('/api/checkout-url', (req, res) => {
  if (!FZ_USERNAME || !FZ_SHARED_SECRET) {
    return res.status(500).json({ error: 'Set FZ_USERNAME and FZ_SHARED_SECRET in server.js first.' });
  }

  const reference = `card_${Date.now()}`;
  const amount = '1.00';
  const currency = 'AUD';

  const hash = buildVerificationHash(FZ_SHARED_SECRET, { reference, amount, currency });
  const url = `${HPP_BASE_URL}/${FZ_USERNAME}/${reference}/${currency}/${amount}/${hash}?iframe=true&postmessage=true&tokenize_only=true`;

  res.json({ url });
});

// The postMessage payload is untrusted until this endpoint verifies it: the
// shared secret needed to check it never reaches the browser. Tokenize-only
// responses sign response_code:token, not the full purchase field set.
app.post('/api/verify-token', (req, res) => {
  const { r, token, v } = req.body ?? {};
  const verified = verifyTokenizeResponse(FZ_SHARED_SECRET, { responseCode: r, token, verification: v });
  res.json({ verified, token });
});

// ── Charge a saved token later ───────────────────────────────────────────
// This is what a server does on its own for a subscription renewal or
// repeat purchase; there's no browser flow for it, just a stored token.

// The recurring/instalment fields from the Tokenisation guide: set when
// this is a later charge in a series, not the customer's original
// card-present transaction.
app.post('/api/charge-token', async (req, res) => {
  if (!FZ_USERNAME || !FZ_TOKEN) {
    return res.status(500).json({ error: 'Set FZ_USERNAME and FZ_TOKEN in server.js first.' });
  }

  const { cardToken, amount, reference, recurring } = req.body ?? {};
  const body = {
    amount: Math.round(Number(amount) * 100),
    currency: 'AUD',
    card_token: cardToken,
    reference,
    customer_ip: req.ip,
  };
  if (recurring) {
    body.extra = { ecm: 32, stored_credential_indicator: 'S' };
  }

  const upstream = await fetch(`${GATEWAY_HOST}/v1.0/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: basicAuthHeader() },
    body: JSON.stringify(body),
  });
  res.status(upstream.status).json(await upstream.json());
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
