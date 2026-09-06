import crypto from 'crypto';

// Deterministically derived from the merchant's own API token + username, so
// it never needs to be requested from ArtsPay support or hardcoded. See
// https://artspay.com/docs/guides/google-pay-web. Regenerate if the API
// token is ever rotated, since the derived ID changes with it.
export function GoogleDeriveGatewayMerchantId(username, apiToken) {
  const digest = crypto.createHash('sha256').update(apiToken).digest('hex').toLowerCase();
  return `${username}-${digest.slice(0, 16)}`;
}
