import { NextResponse } from 'next/server';
import { FZ_USERNAME, FZ_SHARED_SECRET, FZ_OAUTH_ACCESS_KEY, FZ_OAUTH_ACCESS_SECRET } from '../../../lib/config.js';
import { buildPaymentIntentVerification } from '../../../lib/payment-intent.js';

const OAUTH_HOST = 'https://api.pmnts-sandbox.io';
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

// fatzebra.js needs a fresh OAuth token (15-minute expiry) before it can run
// a 3DS2 check, so the frontend fetches this once per checkout rather than
// reusing one across sessions. The access key/secret used to mint it never
// reach the browser, only the resulting short-lived token does.
export async function GET(request) {
  if (!FZ_USERNAME || !FZ_SHARED_SECRET || !FZ_OAUTH_ACCESS_KEY || !FZ_OAUTH_ACCESS_SECRET) {
    return NextResponse.json({
      error: 'Set FZ_USERNAME, FZ_SHARED_SECRET, FZ_OAUTH_ACCESS_KEY and FZ_OAUTH_ACCESS_SECRET in lib/config.js first.',
    }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const rawAmount = searchParams.get('amount');
  const amount = rawAmount && AMOUNT_PATTERN.test(rawAmount) ? rawAmount : '5.00';
  const amountCents = Math.round(Number(amount) * 100);

  const tokenRes = await fetch(`${OAUTH_HOST}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_key: FZ_OAUTH_ACCESS_KEY, access_secret: FZ_OAUTH_ACCESS_SECRET }),
  });
  const tokenBody = await tokenRes.json();
  const accessToken = tokenBody?.data?.token;
  if (!tokenRes.ok || !accessToken) {
    return NextResponse.json({ error: 'Failed to obtain an OAuth access token', details: tokenBody }, { status: 502 });
  }

  const reference = `order_${Date.now()}`;
  const currency = 'AUD';
  const verification = buildPaymentIntentVerification(FZ_SHARED_SECRET, { reference, amountCents, currency });

  return NextResponse.json({ username: FZ_USERNAME, accessToken, amountCents, currency, reference, verification });
}
