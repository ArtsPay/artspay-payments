import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { buildVerificationHash, verifyTokenizeResponse } from '../lib/hmac.js';

test('buildVerificationHash joins reference:amount:currency', () => {
  const secret = 'test-secret';
  const expected = crypto.createHmac('md5', secret).update('card_123:1.00:AUD').digest('hex');
  const actual = buildVerificationHash(secret, { reference: 'card_123', amount: '1.00', currency: 'AUD' });
  assert.equal(actual, expected);
});

test('verifyTokenizeResponse verifies response_code:token', () => {
  const secret = 'test-secret';
  const verification = crypto.createHmac('md5', secret).update('1:abcd1234').digest('hex');
  assert.equal(verifyTokenizeResponse(secret, { responseCode: '1', token: 'abcd1234', verification }), true);
});

test('verifyTokenizeResponse rejects a tampered token', () => {
  const secret = 'test-secret';
  const verification = crypto.createHmac('md5', secret).update('1:abcd1234').digest('hex');
  assert.equal(verifyTokenizeResponse(secret, { responseCode: '1', token: 'wrong-token', verification }), false);
});

test('verifyTokenizeResponse rejects when signed with the wrong shared secret', () => {
  const verification = crypto.createHmac('md5', 'wrong-secret').update('1:abcd1234').digest('hex');
  assert.equal(verifyTokenizeResponse('test-secret', { responseCode: '1', token: 'abcd1234', verification }), false);
});
