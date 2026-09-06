import hashlib


# Deterministically derived from the merchant's own API token + username, so
# it never needs to be requested from ArtsPay support or hardcoded. See
# https://artspay.com/docs/guides/google-pay-web. Regenerate if the API
# token is ever rotated, since the derived ID changes with it.
def google_derive_gateway_merchant_id(username, api_token):
    digest = hashlib.sha256(api_token.encode()).hexdigest().lower()
    return f'{username}-{digest[:16]}'
