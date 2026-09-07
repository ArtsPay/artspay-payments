import hashlib
import hmac


# PaymentIntent.verification (used by fatzebra.js's renderPaymentsPage and
# verifyCard) is a different hash shape to the plain V3 Hosted Payment
# Page's URL hash: it signs the subunit (integer cents) amount, not a
# decimal string, and field order is reference:amount:currency. Must only
# ever be calculated server-side, since the shared secret would otherwise
# be visible in the browser. See https://artspay.com/docs/guides/3d-secure
# and Fat Zebra's PaymentIntent reference for the worked example this
# matches.
def build_payment_intent_verification(shared_secret, reference, amount_cents, currency, hide_card_holder=False):
    parts = [reference, str(amount_cents), currency]
    if hide_card_holder:
        parts.append('true')
    message = ':'.join(parts).encode()
    return hmac.new(shared_secret.encode(), message, hashlib.md5).hexdigest()
