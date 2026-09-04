const path = require('path');
const express = require('express');
const { AppleIsValidMerchantValidationUrl } = require('./apple-pay');
const { GoogleDeriveGatewayMerchantId } = require('./google-pay');

// Set FZ_USERNAME / FZ_TOKEN as environment variables to your ArtsPay
// sandbox API username and token, used for HTTP Basic Auth against Fat
// Zebra's PayNow/Gateway APIs. Never hardcode real credentials here or
// commit them to a repository; this file is not gitignored.
const FZ_USERNAME = process.env.FZ_USERNAME || '';
const FZ_TOKEN = process.env.FZ_TOKEN || '';

const app = express();
// Fat Zebra requires customer_ip on every purchase; behind a proxy/load
// balancer the real client IP is in X-Forwarded-For, not the socket address.
app.set('trust proxy', true);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const SESSION_HOST = 'https://paynow.pmnts-sandbox.io';
const GATEWAY_HOST = 'https://gateway.pmnts-sandbox.io';

function basicAuthHeader() {
  return 'Basic ' + Buffer.from(`${FZ_USERNAME}:${FZ_TOKEN}`).toString('base64');
}

function requireCredentials(res) {
  if (FZ_USERNAME && FZ_TOKEN) return true;
  res.status(500).json({ error: 'Set FZ_USERNAME and FZ_TOKEN in server.js first.' });
  return false;
}

// Shared by both wallets: same purchase endpoint, same auth, only the
// `wallet` object differs.
async function chargeWallet(wallet, { amount, reference, customerIp }) {
  return fetch(`${GATEWAY_HOST}/v1.0/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: basicAuthHeader() },
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      currency: 'AUD',
      reference,
      customer_ip: customerIp,
      wallet,
    }),
  });
}

// ── Apple Pay ────────────────────────────────────────────────────────────
// To remove: delete this section, apple-pay.js, public/apple-pay.js, and
// the #apple-pay-button + its <script> tag in public/index.html.

// Apple looks for this file at /.well-known/apple-developer-merchantid-domain-association
// on your real domain, once, as part of registering the domain (see README).
app.get('/.well-known/apple-developer-merchantid-domain-association', async (req, res) => {
  const file = process.env.NODE_ENV === 'production'
    ? 'https://paynow.pmnts.io/apple_pay/domain_verification/production.txt'
    : 'https://paynow.pmnts.io/apple_pay/domain_verification/sandbox.txt';
  const upstream = await fetch(file);
  res.type('text/plain').send(await upstream.text());
});

// The browser's session.onvalidatemerchant handler posts Apple's
// validationURL here. We check it's really an Apple host, then call Fat
// Zebra's Get Apple Pay Session endpoint and hand back the opaque session.
app.post('/api/apple-pay/session', async (req, res) => {
  if (!requireCredentials(res)) return;

  const { validationURL } = req.body ?? {};
  if (!AppleIsValidMerchantValidationUrl(validationURL)) {
    return res.status(400).json({ error: 'validationURL is not an Apple Pay domain' });
  }

  const params = new URLSearchParams({
    url: validationURL,
    domain_name: req.hostname,
    display_name: 'ArtsPay Example Store',
  });

  const upstream = await fetch(`${SESSION_HOST}/v2/apple_pay/payment_session?${params}`, {
    headers: { Authorization: basicAuthHeader() },
  });
  res.status(upstream.status).json(await upstream.json());
});

// The browser's session.onpaymentauthorized handler posts the encrypted
// payment token here once the customer authorizes with Face ID/Touch ID.
app.post('/api/apple-pay/charge', async (req, res) => {
  if (!requireCredentials(res)) return;
  const { token, amount, reference } = req.body ?? {};
  const upstream = await chargeWallet({ type: 'APPLEPAYWEB', token }, { amount, reference, customerIp: req.ip });
  res.status(upstream.status).json(await upstream.json());
});

// ── Google Pay ───────────────────────────────────────────────────────────
// To remove: delete this section, google-pay.js, public/google-pay.js, and
// the #google-pay-button + its <script> tag in public/index.html.

// The frontend fetches this once to configure tokenizationSpecification; see
// https://artspay.com/docs/guides/google-pay-web.
app.get('/api/google-pay/config', (req, res) => {
  if (!requireCredentials(res)) return;
  res.json({ gatewayMerchantId: GoogleDeriveGatewayMerchantId(FZ_USERNAME, FZ_TOKEN) });
});

// paymentData.paymentMethodData.tokenizationData.token from Google's
// loadPaymentData() is a JSON string; parse it before sending it on.
app.post('/api/google-pay/charge', async (req, res) => {
  if (!requireCredentials(res)) return;
  const { token, amount, reference } = req.body ?? {};
  const upstream = await chargeWallet({ type: 'GOOGLE', token: JSON.parse(token) }, { amount, reference, customerIp: req.ip });
  res.status(upstream.status).json(await upstream.json());
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
