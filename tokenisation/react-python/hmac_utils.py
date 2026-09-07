import hashlib
import hmac


def build_verification_hash(shared_secret, reference, amount, currency, hide_card_holder=False, return_path=None):
    parts = [reference, amount, currency]
    if hide_card_holder:
        parts.append('true')
    if return_path:
        parts.append(return_path)
    message = ':'.join(parts).encode()
    return hmac.new(shared_secret.encode(), message, hashlib.md5).hexdigest()


def verify_tokenize_response(shared_secret, response_code, token, verification):
    message = f'{response_code}:{token}'.encode()
    expected = hmac.new(shared_secret.encode(), message, hashlib.md5).hexdigest()
    return expected == verification
