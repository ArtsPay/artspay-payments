import hashlib
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from google_pay import google_derive_gateway_merchant_id  # noqa: E402


def test_derives_gateway_merchant_id_from_username_and_lowercase_sha256_of_the_api_token():
    username = 'artspay-username'
    api_token = 'some-api-token'
    digest = hashlib.sha256(api_token.encode()).hexdigest().lower()
    expected = f'{username}-{digest[:16]}'
    assert google_derive_gateway_merchant_id(username, api_token) == expected


def test_changes_when_the_api_token_changes():
    a = google_derive_gateway_merchant_id('user', 'token-a')
    b = google_derive_gateway_merchant_id('user', 'token-b')
    assert a != b
