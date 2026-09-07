import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from payment_intent import build_payment_intent_verification  # noqa: E402

# These match Fat Zebra's own worked example in the PaymentIntent reference
# docs exactly (shared_secret "abc123", reference "INV4567", amount "1000",
# currency "AUD"), not just an independently-computed HMAC like most other
# tests in this repo use, since Fat Zebra publish real expected values for
# this one.


def test_matches_the_documented_example_with_hide_card_holder_omitted():
    verification = build_payment_intent_verification('abc123', 'INV4567', 1000, 'AUD')
    assert verification == '0a40877ca9f75152f27bf093af7fd44b'


def test_matches_the_documented_example_with_hide_card_holder_true():
    verification = build_payment_intent_verification('abc123', 'INV4567', 1000, 'AUD', hide_card_holder=True)
    assert verification == 'c045c96c113ae660b91b60bd09feda20'


def test_changes_when_the_amount_changes():
    a = build_payment_intent_verification('abc123', 'INV1', 100, 'AUD')
    b = build_payment_intent_verification('abc123', 'INV1', 200, 'AUD')
    assert a != b
