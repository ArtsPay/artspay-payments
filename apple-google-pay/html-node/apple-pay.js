// Apple requires the validationURL from onvalidatemerchant to be forwarded
// as-is to Fat Zebra, but a malicious client could POST an arbitrary URL to
// our /api/apple-pay/session endpoint, so check it's actually an Apple Pay
// gateway host before making the outbound request. Mirrors Apple's own
// guidance: https://developer.apple.com/documentation/apple_pay_on_the_web/apple_pay_js_api/providing_merchant_validation
const APPLE_PAY_HOST_PATTERN = /^[a-z0-9-]*apple-pay-gateway[a-z0-9-]*\.apple\.com$/i;

function AppleIsValidMerchantValidationUrl(url) {
  if (!url) return false;
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return parsed.protocol === 'https:' && APPLE_PAY_HOST_PATTERN.test(parsed.hostname);
}

module.exports = { AppleIsValidMerchantValidationUrl };
