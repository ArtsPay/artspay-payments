import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { buildVerificationHash, verifyPurchaseResponse, verifyTokenizeResponse } from '../lib/hmac.js';

// Fat Zebra's docs give the field order and an example string, but not a
// published (secret, hash) test vector, so these tests check the string
// construction against an independent HMAC-MD5 call rather than a fixed
// expected hash.

test('buildVerificationHash joins reference:amount:currency', () => {
  const secret = 'test-secret';
  const expected = crypto.createHmac('md5', secret).update('INV1121:100.25:AUD').digest('hex');
  const actual = buildVerificationHash(secret, { reference: 'INV1121', amount: '100.25', currency: 'AUD' });
  assert.equal(actual, expected);
});

test('buildVerificationHash appends hide_card_holder when set', () => {
  const secret = 'test-secret';
  const expected = crypto.createHmac('md5', secret).update('INV1121:100.25:AUD:true').digest('hex');
  const actual = buildVerificationHash(secret, {
    reference: 'INV1121', amount: '100.25', currency: 'AUD', hideCardHolder: true,
  });
  assert.equal(actual, expected);
});

test('buildVerificationHash appends return_path after hide_card_holder', () => {
  const secret = 'test-secret';
  const expected = crypto
    .createHmac('md5', secret)
    .update('INV1121:100.25:AUD:true:https://example.com/cb')
    .digest('hex');
  const actual = buildVerificationHash(secret, {
    reference: 'INV1121',
    amount: '100.25',
    currency: 'AUD',
    hideCardHolder: true,
    returnPath: 'https://example.com/cb',
  });
  assert.equal(actual, expected);
});

test('buildVerificationHash omits return_path when not provided, even if hide_card_holder is not set', () => {
  const secret = 'test-secret';
  const expected = crypto.createHmac('md5', secret).update('INV1121:100.25:AUD').digest('hex');
  const actual = buildVerificationHash(secret, {
    reference: 'INV1121', amount: '100.25', currency: 'AUD', returnPath: '',
  });
  assert.equal(actual, expected);
});

test('verifyPurchaseResponse accepts a correctly signed response', () => {
  const secret = 'test-secret';
  const payload = {
    responseCode: '1', successful: 'true', amount: '10025', currency: 'AUD', id: '001-P-ABCDG1123', token: 'abcd1234',
  };
  const verification = crypto
    .createHmac('md5', secret)
    .update(`${payload.responseCode}:${payload.successful}:${payload.amount}:${payload.currency}:${payload.id}:${payload.token}`)
    .digest('hex');
  assert.equal(verifyPurchaseResponse(secret, { ...payload, verification }), true);
});

test('verifyPurchaseResponse rejects a tampered field', () => {
  const secret = 'test-secret';
  const payload = {
    responseCode: '1', successful: 'true', amount: '10025', currency: 'AUD', id: '001-P-ABCDG1123', token: 'abcd1234',
  };
  const verification = crypto
    .createHmac('md5', secret)
    .update(`${payload.responseCode}:${payload.successful}:${payload.amount}:${payload.currency}:${payload.id}:${payload.token}`)
    .digest('hex');
  assert.equal(verifyPurchaseResponse(secret, { ...payload, amount: '99999', verification }), false);
});

test('verifyPurchaseResponse rejects when signed with the wrong shared secret', () => {
  const payload = {
    responseCode: '1', successful: 'true', amount: '10025', currency: 'AUD', id: '001-P-ABCDG1123', token: 'abcd1234',
  };
  const verification = crypto
    .createHmac('md5', 'wrong-secret')
    .update(`${payload.responseCode}:${payload.successful}:${payload.amount}:${payload.currency}:${payload.id}:${payload.token}`)
    .digest('hex');
  assert.equal(verifyPurchaseResponse('test-secret', { ...payload, verification }), false);
});

test('verifyTokenizeResponse verifies response_code:token', () => {
  const secret = 'test-secret';
  const verification = crypto.createHmac('md5', secret).update('1:abcd1234').digest('hex');
  assert.equal(verifyTokenizeResponse(secret, { responseCode: '1', token: 'abcd1234', verification }), true);
});
