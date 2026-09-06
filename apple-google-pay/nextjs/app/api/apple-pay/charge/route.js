import { NextResponse } from 'next/server';
import { FZ_USERNAME, FZ_TOKEN } from '../../../../lib/config.js';
import { chargeWallet } from '../../../../lib/charge-wallet.js';
import { getCustomerIp } from '../../../../lib/customer-ip.js';

// The browser's session.onpaymentauthorized handler posts the encrypted
// payment token here once the customer authorizes with Face ID/Touch ID.
export async function POST(request) {
  if (!FZ_USERNAME || !FZ_TOKEN) {
    return NextResponse.json({ error: 'Set FZ_USERNAME and FZ_TOKEN in lib/config.js first.' }, { status: 500 });
  }

  const { token, amount, reference } = await request.json();
  const upstream = await chargeWallet(
    { type: 'APPLEPAYWEB', token },
    { amount, reference, customerIp: getCustomerIp(request), username: FZ_USERNAME, apiToken: FZ_TOKEN },
  );
  return NextResponse.json(await upstream.json(), { status: upstream.status });
}
