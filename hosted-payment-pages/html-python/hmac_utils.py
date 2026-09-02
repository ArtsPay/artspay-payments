import hashlib
import hmac


def hmac_md5_hex(shared_secret: str, message: str) -> str:
    return hmac.new(shared_secret.encode(), message.encode(), hashlib.md5).hexdigest()


def build_verification_hash(shared_secret, reference, amount, currency, hide_card_holder=False, return_path=None):
    """
    Builds the verification hash for a V3 Hosted Payment Page request URL.
    Field order matters: reference, amount, currency, then hide_card_holder
    and return_path if present. See the Hosted Payment Pages guide at
    artspay.com/docs/guides for the full signing scheme.
    """
    parts = [reference, amount, currency]
    if hide_card_holder:
        parts.append('true')
    if return_path:
        parts.append(return_path)
    return hmac_md5_hex(shared_secret, ':'.join(parts))


def verify_purchase_response(shared_secret, response_code, successful, amount, currency, id_, token, verification):
    """Verifies a purchase response's `v` param against response_code:successful:amount:currency:id:token."""
    expected = hmac_md5_hex(shared_secret, f'{response_code}:{successful}:{amount}:{currency}:{id_}:{token}')
    return expected == verification


def verify_tokenize_response(shared_secret, response_code, token, verification):
    """Verifies a tokenize-only response's `v` param against response_code:token."""
    expected = hmac_md5_hex(shared_secret, f'{response_code}:{token}')
    return expected == verification
