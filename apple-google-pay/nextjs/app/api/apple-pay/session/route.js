import { NextResponse } from 'next/server';
import { FZ_USERNAME, FZ_TOKEN } from '../../../../lib/config.js';
import { AppleIsValidMerchantValidationUrl } from '../../../../lib/apple-pay.js';
import { basicAuthHeader } from '../../../../lib/fatzebra-auth.js';

const SESSION_HOST = 'https://paynow.pmnts-sandbox.io';

// The browser's session.onvalidatemerchant handler posts Apple's
// validationURL here. We check it's really an Apple host, then call Fat
// Zebra's Get Apple Pay Session endpoint and hand back the opaque session.
export async function POST(request) {
  if (!FZ_USERNAME || !FZ_TOKEN) {
    return NextResponse.json({ error: 'Set FZ_USERNAME and FZ_TOKEN in lib/config.js first.' }, { status: 500 });
  }

  const { validationURL } = await request.json();
  if (!AppleIsValidMerchantValidationUrl(validationURL)) {
    return NextResponse.json({ error: 'validationURL is not an Apple Pay domain' }, { status: 400 });
  }

  const params = new URLSearchParams({
    url: validationURL,
    domain_name: new URL(request.url).hostname,
    display_name: 'ArtsPay Example Store',
  });

  const upstream = await fetch(`${SESSION_HOST}/v2/apple_pay/payment_session?${params}`, {
    headers: { Authorization: basicAuthHeader(FZ_USERNAME, FZ_TOKEN) },
  });
  return NextResponse.json(await upstream.json(), { status: upstream.status });
}
