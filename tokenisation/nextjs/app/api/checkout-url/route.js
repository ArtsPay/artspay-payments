import { NextResponse } from 'next/server';
import { FZ_USERNAME, FZ_SHARED_SECRET } from '../../../lib/config.js';
import { buildVerificationHash } from '../../../lib/hmac.js';

const HPP_BASE_URL = 'https://paynow.pmnts-sandbox.io/v3';

// Returns a Hosted Payment Page URL with tokenize_only=true, so the card is
// stored but never charged. The nominal amount shown during tokenize-only
// mode is never actually captured.
export async function GET() {
  if (!FZ_USERNAME || !FZ_SHARED_SECRET) {
    return NextResponse.json({ error: 'Set FZ_USERNAME and FZ_SHARED_SECRET in lib/config.js first.' }, { status: 500 });
  }

  const reference = `card_${Date.now()}`;
  const amount = '1.00';
  const currency = 'AUD';

  const hash = buildVerificationHash(FZ_SHARED_SECRET, { reference, amount, currency });
  const url = `${HPP_BASE_URL}/${FZ_USERNAME}/${reference}/${currency}/${amount}/${hash}?iframe=true&postmessage=true&tokenize_only=true`;

  return NextResponse.json({ url });
}
