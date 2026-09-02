import { NextResponse } from 'next/server';
import { FZ_SHARED_SECRET } from '../../../lib/config';
import { verifyPurchaseResponse } from '../../../lib/hmac';

// The postMessage payload is untrusted until this endpoint verifies it: the
// shared secret needed to check it never reaches the browser.
export async function POST(request) {
  const body = await request.json();

  const verified = verifyPurchaseResponse(FZ_SHARED_SECRET, {
    responseCode: body.r, successful: body.successful, amount: body.amount,
    currency: body.currency, id: body.id, token: body.token, verification: body.v,
  });

  return NextResponse.json({ verified });
}
