import hashlib
import hmac
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from hmac_utils import build_verification_hash, verify_tokenize_response  # noqa: E402

# Fat Zebra's docs give the field order and an example string, but not a
# published (secret, hash) test vector, so these tests check the string
# construction against an independent HMAC-MD5 call rather than a fixed
# expected hash.


def hmac_md5(secret, message):
    return hmac.new(secret.encode(), message.encode(), hashlib.md5).hexdigest()


def test_build_verification_hash_joins_reference_amount_currency():
    secret = 'test-secret'
    expected = hmac_md5(secret, 'card_123:1.00:AUD')
    actual = build_verification_hash(secret, 'card_123', '1.00', 'AUD')
    assert actual == expected


def test_verify_tokenize_response_accepts_a_correctly_signed_response():
    secret = 'test-secret'
    verification = hmac_md5(secret, '1:abcd1234')
    assert verify_tokenize_response(secret, '1', 'abcd1234', verification) is True


def test_verify_tokenize_response_rejects_a_tampered_token():
    secret = 'test-secret'
    verification = hmac_md5(secret, '1:abcd1234')
    assert verify_tokenize_response(secret, '1', 'wrong-token', verification) is False


def test_verify_tokenize_response_rejects_the_wrong_shared_secret():
    verification = hmac_md5('wrong-secret', '1:abcd1234')
    assert verify_tokenize_response('test-secret', '1', 'abcd1234', verification) is False
