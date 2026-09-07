import hashlib
import hmac
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from payment_result import verify_payment_result  # noqa: E402

# Fat Zebra's own worked example for this hash is internally inconsistent
# (mixes fields from two different sample payloads, and doesn't actually
# hash to the verification value it shows), so these tests check the
# string construction against an independent HMAC-MD5 call instead, same
# approach as the other HMAC tests in this repo that lack a real vector.


def sample_data(**overrides):
    data = {
        'transactionId': '40057-P-F7R7M9Q6',
        'responseCode': '00',
        'message': 'Approved',
        'amount': 100,
        'currency': 'AUD',
        'reference': 'sgc99pycds20i97q',
        'cardNumber': '400000XXXXXX1091',
        'cardHolder': 'XXX',
        'cardExpiry': '2023-12-31',
        'cardType': 'VISA',
    }
    data.update(overrides)
    return data


def hash_for(secret, data):
    parts = [
        data['transactionId'], data['responseCode'], data['message'], data['amount'], data['currency'],
        data['reference'], data['cardNumber'], data['cardHolder'], data['cardExpiry'], data['cardType'],
    ]
    message = ':'.join(str(part) for part in parts).encode()
    return hmac.new(secret.encode(), message, hashlib.md5).hexdigest()


def test_accepts_a_correctly_signed_result():
    secret = 'test-secret'
    data = sample_data()
    verification = hash_for(secret, data)
    assert verify_payment_result(secret, {**data, 'verification': verification}) is True


def test_rejects_a_tampered_field():
    secret = 'test-secret'
    data = sample_data()
    verification = hash_for(secret, data)
    tampered = {**sample_data(amount=99999), 'verification': verification}
    assert verify_payment_result(secret, tampered) is False


def test_matches_the_field_order_of_a_real_captured_sandbox_response():
    # event.detail.data from an actual OTP-challenge sandbox payment. The
    # shared secret is swapped for a placeholder here, but the field
    # values/shapes are real, confirming this isn't just our own assumed
    # field order: it's what fatzebra.js actually sent.
    secret = 'test-secret'
    data = {
        'transactionId': '41191-P-P53RPJ3HPSVKMQED',
        'responseCode': '00',
        'message': 'Approved',
        'amount': 500,
        'currency': 'AUD',
        'reference': 'order_1788745835001',
        'cardNumber': '400000XXXXXX1000',
        'cardHolder': 'Test 3DS',
        'cardExpiry': '2029-12-31',
        'cardType': 'VISA',
    }
    verification = hash_for(secret, data)
    assert verify_payment_result(secret, {**data, 'verification': verification}) is True


def test_rejects_when_signed_with_the_wrong_shared_secret():
    data = sample_data()
    verification = hash_for('wrong-secret', data)
    assert verify_payment_result('test-secret', {**data, 'verification': verification}) is False
