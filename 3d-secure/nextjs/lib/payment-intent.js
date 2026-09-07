import crypto from 'crypto';

// PaymentIntent.verification (used by fatzebra.js's renderPaymentsPage and
// verifyCard) is a different hash shape to the plain V3 Hosted Payment
// Page's URL hash: it signs the subunit (integer cents) amount, not a
// decimal string, and field order is reference:amount:currency. Must only
// ever be calculated server-side, since the shared secret would otherwise
// be visible in the browser. See https://artspay.com/docs/guides/3d-secure
// and Fat Zebra's PaymentIntent reference for the worked example this
// matches.
export function buildPaymentIntentVerification(sharedSecret, { reference, amountCents, currency, hideCardHolder }) {
  const parts = [reference, String(amountCents), currency];
  if (hideCardHolder) parts.push('true');
  return crypto.createHmac('md5', sharedSecret).update(parts.join(':')).digest('hex');
}
