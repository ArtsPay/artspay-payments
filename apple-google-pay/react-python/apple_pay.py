import re
from urllib.parse import urlparse

# Apple requires the validationURL from onvalidatemerchant to be forwarded
# as-is to Fat Zebra, but a malicious client could POST an arbitrary URL to
# our /api/apple-pay/session endpoint, so check it's actually an Apple Pay
# gateway host before making the outbound request. Mirrors Apple's own
# guidance: https://developer.apple.com/documentation/apple_pay_on_the_web/apple_pay_js_api/providing_merchant_validation
APPLE_PAY_HOST_PATTERN = re.compile(r'^[a-z0-9-]*apple-pay-gateway[a-z0-9-]*\.apple\.com$', re.IGNORECASE)


def apple_is_valid_merchant_validation_url(url):
    if not url:
        return False
    parsed = urlparse(url)
    return parsed.scheme == 'https' and bool(APPLE_PAY_HOST_PATTERN.match(parsed.hostname or ''))
