import { NextResponse } from 'next/server';
import { FZ_USERNAME, FZ_SHARED_SECRET } from '../../../lib/config';
import { buildVerificationHash } from '../../../lib/hmac';

const HPP_BASE_URL = 'https://paynow.pmnts-sandbox.io/v3';
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

// Returns a Hosted Payment Page URL for embedding in an iframe. Uses
// iframe=true&postmessage=true, not a redirect: the hosted page posts the
// result back to the parent window instead of navigating away.
export async function GET(request) {
  if (!FZ_USERNAME || !FZ_SHARED_SECRET) {
    return NextResponse.json({ error: 'Set FZ_USERNAME and FZ_SHARED_SECRET in lib/config.js first.' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const rawAmount = searchParams.get('amount');
  const amount = rawAmount && AMOUNT_PATTERN.test(rawAmount) ? rawAmount : '10.25';
  const reference = `order_${Date.now()}`;
  const currency = 'AUD';

  const hash = buildVerificationHash(FZ_SHARED_SECRET, { reference, amount, currency });
  const url = `${HPP_BASE_URL}/${FZ_USERNAME}/${reference}/${currency}/${amount}/${hash}?iframe=true&postmessage=true`;

  return NextResponse.json({ url });
}
