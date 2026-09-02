import hashlib
import hmac
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from hmac_utils import build_verification_hash, verify_purchase_response, verify_tokenize_response  # noqa: E402

# Fat Zebra's docs give the field order and an example string, but not a
# published (secret, hash) test vector, so these tests check the string
# construction against an independent HMAC-MD5 call rather than a fixed
# expected hash.


def hmac_md5(secret, message):
    return hmac.new(secret.encode(), message.encode(), hashlib.md5).hexdigest()


def test_build_verification_hash_joins_reference_amount_currency():
    secret = 'test-secret'
    expected = hmac_md5(secret, 'INV1121:100.25:AUD')
    actual = build_verification_hash(secret, 'INV1121', '100.25', 'AUD')
    assert actual == expected


def test_build_verification_hash_appends_hide_card_holder():
    secret = 'test-secret'
    expected = hmac_md5(secret, 'INV1121:100.25:AUD:true')
    actual = build_verification_hash(secret, 'INV1121', '100.25', 'AUD', hide_card_holder=True)
    assert actual == expected


def test_build_verification_hash_appends_return_path_after_hide_card_holder():
    secret = 'test-secret'
    expected = hmac_md5(secret, 'INV1121:100.25:AUD:true:https://example.com/cb')
    actual = build_verification_hash(
        secret, 'INV1121', '100.25', 'AUD', hide_card_holder=True, return_path='https://example.com/cb',
    )
    assert actual == expected


def test_build_verification_hash_omits_return_path_when_blank():
    secret = 'test-secret'
    expected = hmac_md5(secret, 'INV1121:100.25:AUD')
    actual = build_verification_hash(secret, 'INV1121', '100.25', 'AUD', return_path='')
    assert actual == expected


def test_verify_purchase_response_accepts_correctly_signed_response():
    secret = 'test-secret'
    response_code, successful, amount, currency, id_, token = '1', 'true', '10025', 'AUD', '001-P-ABCDG1123', 'abcd1234'
    verification = hmac_md5(secret, f'{response_code}:{successful}:{amount}:{currency}:{id_}:{token}')
    assert verify_purchase_response(secret, response_code, successful, amount, currency, id_, token, verification) is True


def test_verify_purchase_response_rejects_tampered_field():
    secret = 'test-secret'
    response_code, successful, amount, currency, id_, token = '1', 'true', '10025', 'AUD', '001-P-ABCDG1123', 'abcd1234'
    verification = hmac_md5(secret, f'{response_code}:{successful}:{amount}:{currency}:{id_}:{token}')
    assert verify_purchase_response(secret, response_code, successful, '99999', currency, id_, token, verification) is False


def test_verify_purchase_response_rejects_wrong_secret():
    response_code, successful, amount, currency, id_, token = '1', 'true', '10025', 'AUD', '001-P-ABCDG1123', 'abcd1234'
    verification = hmac_md5('wrong-secret', f'{response_code}:{successful}:{amount}:{currency}:{id_}:{token}')
    assert verify_purchase_response('test-secret', response_code, successful, amount, currency, id_, token, verification) is False


def test_verify_tokenize_response():
    secret = 'test-secret'
    verification = hmac_md5(secret, '1:abcd1234')
    assert verify_tokenize_response(secret, '1', 'abcd1234', verification) is True
