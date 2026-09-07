import hashlib
import hmac


# fz.payment.success/fz.payment.error carry their own verification hash
# over the full transaction result, untrusted until confirmed here, the
# same way the plain Hosted Payment Page example verifies its own response
# hash. Field order matters: transactionId, responseCode, message, amount,
# currency, reference, cardNumber, cardHolder, cardExpiry, cardType. Fat
# Zebra's own worked example for this one is internally inconsistent (it
# doesn't actually hash to the verification value it shows), so this
# follows the documented field order rather than that example.
def verify_payment_result(shared_secret, data):
    parts = [
        data.get('transactionId'), data.get('responseCode'), data.get('message'), data.get('amount'),
        data.get('currency'), data.get('reference'), data.get('cardNumber'), data.get('cardHolder'),
        data.get('cardExpiry'), data.get('cardType'),
    ]
    message = ':'.join(str(part) for part in parts).encode()
    expected = hmac.new(shared_secret.encode(), message, hashlib.md5).hexdigest()
    return expected == data.get('verification')
