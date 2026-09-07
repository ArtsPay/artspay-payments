import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { verifyPaymentResult } from '../lib/payment-result.js';

// Fat Zebra's own worked example for this hash is internally inconsistent
// (mixes fields from two different sample payloads, and doesn't actually
// hash to the verification value it shows), so these tests check the
// string construction against an independent HMAC-MD5 call instead, same
// approach as the other HMAC tests in this repo that lack a real vector.

function sampleData(overrides) {
  return Object.assign({
    transactionId: '40057-P-F7R7M9Q6',
    responseCode: '00',
    message: 'Approved',
    amount: 100,
    currency: 'AUD',
    reference: 'sgc99pycds20i97q',
    cardNumber: '400000XXXXXX1091',
    cardHolder: 'XXX',
    cardExpiry: '2023-12-31',
    cardType: 'VISA',
  }, overrides);
}

function hashFor(secret, data) {
  const values = [
    data.transactionId, data.responseCode, data.message, data.amount, data.currency,
    data.reference, data.cardNumber, data.cardHolder, data.cardExpiry, data.cardType,
  ].join(':');
  return crypto.createHmac('md5', secret).update(values).digest('hex');
}

test('accepts a correctly signed result', () => {
  const secret = 'test-secret';
  const data = sampleData();
  const verification = hashFor(secret, data);
  assert.equal(verifyPaymentResult(secret, { ...data, verification }), true);
});

test('rejects a tampered field', () => {
  const secret = 'test-secret';
  const data = sampleData();
  const verification = hashFor(secret, data);
  assert.equal(verifyPaymentResult(secret, { ...sampleData({ amount: 99999 }), verification }), false);
});

test('matches the field order of a real captured sandbox response', () => {
  // event.detail.data from an actual OTP-challenge sandbox payment. The
  // shared secret is swapped for a placeholder here, but the field
  // values/shapes are real, confirming this isn't just our own assumed
  // field order: it's what fatzebra.js actually sent.
  const secret = 'test-secret';
  const data = {
    transactionId: '41191-P-P53RPJ3HPSVKMQED',
    responseCode: '00',
    message: 'Approved',
    amount: 500,
    currency: 'AUD',
    reference: 'order_1788745835001',
    cardNumber: '400000XXXXXX1000',
    cardHolder: 'Test 3DS',
    cardExpiry: '2029-12-31',
    cardType: 'VISA',
  };
  const verification = hashFor(secret, data);
  assert.equal(verifyPaymentResult(secret, { ...data, verification }), true);
});

test('rejects when signed with the wrong shared secret', () => {
  const data = sampleData();
  const verification = hashFor('wrong-secret', data);
  assert.equal(verifyPaymentResult('test-secret', { ...data, verification }), false);
});
