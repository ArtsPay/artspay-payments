import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPaymentIntentVerification } from '../lib/payment-intent.js';

// These match Fat Zebra's own worked example in the PaymentIntent reference
// docs exactly (shared_secret "abc123", reference "INV4567", amount "1000",
// currency "AUD"), not just an independently-computed HMAC like most other
// tests in this repo use, since Fat Zebra publish real expected values for
// this one.

test('matches the documented example with hide_card_holder omitted', () => {
  const verification = buildPaymentIntentVerification('abc123', { reference: 'INV4567', amountCents: 1000, currency: 'AUD' });
  assert.equal(verification, '0a40877ca9f75152f27bf093af7fd44b');
});

test('matches the documented example with hide_card_holder true', () => {
  const verification = buildPaymentIntentVerification('abc123', {
    reference: 'INV4567', amountCents: 1000, currency: 'AUD', hideCardHolder: true,
  });
  assert.equal(verification, 'c045c96c113ae660b91b60bd09feda20');
});

test('changes when the amount changes', () => {
  const a = buildPaymentIntentVerification('abc123', { reference: 'INV1', amountCents: 100, currency: 'AUD' });
  const b = buildPaymentIntentVerification('abc123', { reference: 'INV1', amountCents: 200, currency: 'AUD' });
  assert.notEqual(a, b);
});
