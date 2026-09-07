import { NextResponse } from 'next/server';
import { FZ_USERNAME, FZ_TOKEN } from '../../../lib/config.js';
import { basicAuthHeader } from '../../../lib/fatzebra-auth.js';
import { getCustomerIp } from '../../../lib/customer-ip.js';

const GATEWAY_HOST = 'https://gateway.pmnts-sandbox.io';

// This is what a server does on its own for a subscription renewal or
// repeat purchase; there's no browser flow for it, just a stored token.
export async function POST(request) {
  if (!FZ_USERNAME || !FZ_TOKEN) {
    return NextResponse.json({ error: 'Set FZ_USERNAME and FZ_TOKEN in lib/config.js first.' }, { status: 500 });
  }

  const { cardToken, amount, reference, recurring } = await request.json();
  const body = {
    amount: Math.round(Number(amount) * 100),
    currency: 'AUD',
    card_token: cardToken,
    reference,
    customer_ip: getCustomerIp(request),
  };
  // The recurring/instalment fields from the Tokenisation guide: set when
  // this is a later charge in a series, not the customer's original
  // card-present transaction.
  if (recurring) {
    body.extra = { ecm: 32, stored_credential_indicator: 'S' };
  }

  const upstream = await fetch(`${GATEWAY_HOST}/v1.0/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: basicAuthHeader(FZ_USERNAME, FZ_TOKEN) },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await upstream.json(), { status: upstream.status });
}
