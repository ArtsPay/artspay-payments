import { NextResponse } from 'next/server';
import { FZ_SHARED_SECRET } from '../../../lib/config.js';
import { verifyTokenizeResponse } from '../../../lib/hmac.js';

// The postMessage payload is untrusted until this endpoint verifies it: the
// shared secret needed to check it never reaches the browser. Tokenize-only
// responses sign response_code:token, not the full purchase field set.
export async function POST(request) {
  const body = await request.json();
  const verified = verifyTokenizeResponse(FZ_SHARED_SECRET, {
    responseCode: body.r,
    token: body.token,
    verification: body.v,
  });
  return NextResponse.json({ verified, token: body.token });
}
