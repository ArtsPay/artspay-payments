import { NextResponse } from 'next/server';
import { FZ_USERNAME, FZ_TOKEN } from '../../../../lib/config.js';
import { GoogleDeriveGatewayMerchantId } from '../../../../lib/google-pay.js';

// The frontend fetches this once to configure tokenizationSpecification; see
// https://artspay.com/docs/guides/google-pay-web.
export async function GET() {
  if (!FZ_USERNAME || !FZ_TOKEN) {
    return NextResponse.json({ error: 'Set FZ_USERNAME and FZ_TOKEN in lib/config.js first.' }, { status: 500 });
  }
  return NextResponse.json({ gatewayMerchantId: GoogleDeriveGatewayMerchantId(FZ_USERNAME, FZ_TOKEN) });
}
