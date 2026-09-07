import { NextResponse } from 'next/server';
import { FZ_SHARED_SECRET } from '../../../lib/config.js';
import { verifyPaymentResult } from '../../../lib/payment-result.js';

// fz.payment.success/fz.payment.error's own verification hash is untrusted
// until this endpoint confirms it: the shared secret needed to check it
// never reaches the browser.
export async function POST(request) {
  const data = await request.json();
  const verified = verifyPaymentResult(FZ_SHARED_SECRET, data);
  return NextResponse.json({ verified });
}
