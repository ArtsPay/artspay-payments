import { basicAuthHeader } from './fatzebra-auth.js';

const GATEWAY_HOST = 'https://gateway.pmnts-sandbox.io';

// Shared by both wallets: same purchase endpoint, same auth, only the
// `wallet` object differs.
export async function chargeWallet(wallet, { amount, reference, customerIp, username, apiToken }) {
  return fetch(`${GATEWAY_HOST}/v1.0/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: basicAuthHeader(username, apiToken) },
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      currency: 'AUD',
      reference,
      customer_ip: customerIp,
      wallet,
    }),
  });
}
