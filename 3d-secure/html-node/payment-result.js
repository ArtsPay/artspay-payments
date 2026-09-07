const crypto = require('crypto');

// fz.payment.success/fz.payment.error carry their own verification hash
// over the full transaction result, untrusted until confirmed here, the
// same way the plain Hosted Payment Page example verifies its own response
// hash. Field order matters: transactionId, responseCode, message, amount,
// currency, reference, cardNumber, cardHolder, cardExpiry, cardType. Fat
// Zebra's own worked example for this one is internally inconsistent (it
// doesn't actually hash to the verification value it shows), so this
// follows the documented field order rather than that example.
function verifyPaymentResult(sharedSecret, data) {
  const parts = [
    data.transactionId, data.responseCode, data.message, data.amount, data.currency,
    data.reference, data.cardNumber, data.cardHolder, data.cardExpiry, data.cardType,
  ];
  const expected = crypto.createHmac('md5', sharedSecret).update(parts.join(':')).digest('hex');
  return expected === data.verification;
}

module.exports = { verifyPaymentResult };
