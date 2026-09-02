const crypto = require('crypto');

function hmacMd5Hex(sharedSecret, message) {
  return crypto.createHmac('md5', sharedSecret).update(message).digest('hex');
}

/**
 * Builds the verification hash for a V3 Hosted Payment Page request URL.
 * Field order matters: reference, amount, currency, then hide_card_holder
 * and return_path if present. See the Hosted Payment Pages guide at
 * artspay.com/docs/guides for the full signing scheme.
 */
function buildVerificationHash(sharedSecret, { reference, amount, currency, hideCardHolder, returnPath }) {
  const parts = [reference, amount, currency];
  if (hideCardHolder) parts.push('true');
  if (returnPath) parts.push(returnPath);
  return hmacMd5Hex(sharedSecret, parts.join(':'));
}

/** Verifies a purchase response's `v` param against response_code:successful:amount:currency:id:token. */
function verifyPurchaseResponse(sharedSecret, { responseCode, successful, amount, currency, id, token, verification }) {
  const expected = hmacMd5Hex(sharedSecret, `${responseCode}:${successful}:${amount}:${currency}:${id}:${token}`);
  return expected === verification;
}

/** Verifies a tokenize-only response's `v` param against response_code:token. */
function verifyTokenizeResponse(sharedSecret, { responseCode, token, verification }) {
  const expected = hmacMd5Hex(sharedSecret, `${responseCode}:${token}`);
  return expected === verification;
}

module.exports = { hmacMd5Hex, buildVerificationHash, verifyPurchaseResponse, verifyTokenizeResponse };
