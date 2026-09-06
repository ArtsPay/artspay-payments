import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from apple_pay import apple_is_valid_merchant_validation_url  # noqa: E402


def test_accepts_the_production_apple_pay_gateway_host():
    assert apple_is_valid_merchant_validation_url('https://apple-pay-gateway.apple.com/paymentservices/startSession') is True


def test_accepts_the_sandbox_cert_gateway_host_used_for_testing():
    assert apple_is_valid_merchant_validation_url('https://apple-pay-gateway-cert.apple.com/paymentservices/startSession') is True


def test_accepts_regional_pod_hosts():
    assert apple_is_valid_merchant_validation_url('https://apple-pay-gateway-nc-pod1.apple.com/paymentservices/startSession') is True


def test_rejects_a_non_apple_host():
    assert apple_is_valid_merchant_validation_url('https://evil.example.com/paymentservices/startSession') is False


def test_rejects_a_spoofed_subdomain_suffix_attack():
    assert apple_is_valid_merchant_validation_url('https://apple-pay-gateway.apple.com.evil.com/x') is False


def test_rejects_a_non_https_url():
    assert apple_is_valid_merchant_validation_url('http://apple-pay-gateway.apple.com/x') is False


def test_rejects_missing_or_empty_input():
    assert apple_is_valid_merchant_validation_url('') is False
    assert apple_is_valid_merchant_validation_url(None) is False
