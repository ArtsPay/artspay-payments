// Apple looks for this file at /.well-known/apple-developer-merchantid-domain-association
// on your real domain, once, as part of registering the domain (see README).
export async function GET() {
  const file = process.env.NODE_ENV === 'production'
    ? 'https://paynow.pmnts.io/apple_pay/domain_verification/production.txt'
    : 'https://paynow.pmnts.io/apple_pay/domain_verification/sandbox.txt';
  const upstream = await fetch(file);
  return new Response(await upstream.text(), { headers: { 'Content-Type': 'text/plain' } });
}
