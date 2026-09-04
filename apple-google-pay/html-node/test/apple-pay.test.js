const test = require('node:test');
const assert = require('node:assert/strict');
const { AppleIsValidMerchantValidationUrl } = require('../apple-pay');

test('accepts the production Apple Pay gateway host', () => {
  assert.equal(AppleIsValidMerchantValidationUrl('https://apple-pay-gateway.apple.com/paymentservices/startSession'), true);
});

test('accepts the sandbox/cert gateway host used for testing', () => {
  assert.equal(AppleIsValidMerchantValidationUrl('https://apple-pay-gateway-cert.apple.com/paymentservices/startSession'), true);
});

test('accepts regional pod hosts', () => {
  assert.equal(AppleIsValidMerchantValidationUrl('https://apple-pay-gateway-nc-pod1.apple.com/paymentservices/startSession'), true);
});

test('rejects a non-Apple host', () => {
  assert.equal(AppleIsValidMerchantValidationUrl('https://evil.example.com/paymentservices/startSession'), false);
});

test('rejects a spoofed subdomain suffix attack', () => {
  assert.equal(AppleIsValidMerchantValidationUrl('https://apple-pay-gateway.apple.com.evil.com/x'), false);
});

test('rejects a non-https URL', () => {
  assert.equal(AppleIsValidMerchantValidationUrl('http://apple-pay-gateway.apple.com/x'), false);
});

test('rejects missing or empty input', () => {
  assert.equal(AppleIsValidMerchantValidationUrl(''), false);
  assert.equal(AppleIsValidMerchantValidationUrl(undefined), false);
});
