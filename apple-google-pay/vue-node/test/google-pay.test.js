const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { GoogleDeriveGatewayMerchantId } = require('../google-pay');

test('derives gatewayMerchantId from username and lowercase sha256 of the API token', () => {
  const username = 'arts-test-stateempire';
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
