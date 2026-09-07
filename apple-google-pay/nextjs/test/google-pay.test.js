import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import { GoogleDeriveGatewayMerchantId } from '../lib/google-pay.js';

test('derives gatewayMerchantId from username and lowercase sha256 of the API token', () => {
  const username = 'artspay-username';
  const apiToken = 'some-api-token';
  const digest = crypto.createHash('sha256').update(apiToken).digest('hex').toLowerCase();
  const expected = `${username}-${digest.slice(0, 16)}`;
  assert.equal(GoogleDeriveGatewayMerchantId(username, apiToken), expected);
});

test('changes when the API token changes', () => {
  const a = GoogleDeriveGatewayMerchantId('user', 'token-a');
  const b = GoogleDeriveGatewayMerchantId('user', 'token-b');
  assert.notEqual(a, b);
});
