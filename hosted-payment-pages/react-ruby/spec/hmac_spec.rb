require 'openssl'
require_relative '../hmac'

# Fat Zebra's docs give the field order and an example string, but not a
# published (secret, hash) test vector, so these tests check the string
# construction against an independent HMAC-MD5 call rather than a fixed
# expected hash.

def hmac_md5(secret, message)
  OpenSSL::HMAC.hexdigest('MD5', secret, message)
end

RSpec.describe Hmac do
  describe '.build_verification_hash' do
    it 'joins reference:amount:currency' do
      secret = 'test-secret'
      expected = hmac_md5(secret, 'INV1121:100.25:AUD')
      actual = Hmac.build_verification_hash(secret, reference: 'INV1121', amount: '100.25', currency: 'AUD')
      expect(actual).to eq(expected)
    end

    it 'appends hide_card_holder when set' do
      secret = 'test-secret'
      expected = hmac_md5(secret, 'INV1121:100.25:AUD:true')
      actual = Hmac.build_verification_hash(secret, reference: 'INV1121', amount: '100.25', currency: 'AUD', hide_card_holder: true)
      expect(actual).to eq(expected)
    end

    it 'appends return_path after hide_card_holder' do
      secret = 'test-secret'
      expected = hmac_md5(secret, 'INV1121:100.25:AUD:true:https://example.com/cb')
      actual = Hmac.build_verification_hash(
        secret, reference: 'INV1121', amount: '100.25', currency: 'AUD',
        hide_card_holder: true, return_path: 'https://example.com/cb'
      )
      expect(actual).to eq(expected)
    end

    it 'omits return_path when blank' do
      secret = 'test-secret'
      expected = hmac_md5(secret, 'INV1121:100.25:AUD')
      actual = Hmac.build_verification_hash(secret, reference: 'INV1121', amount: '100.25', currency: 'AUD', return_path: '')
      expect(actual).to eq(expected)
    end
  end

  describe '.verify_purchase_response' do
    it 'accepts a correctly signed response' do
      secret = 'test-secret'
      verification = hmac_md5(secret, '1:true:10025:AUD:001-P-ABCDG1123:abcd1234')
      result = Hmac.verify_purchase_response(
        secret, response_code: '1', successful: 'true', amount: '10025',
        currency: 'AUD', id: '001-P-ABCDG1123', token: 'abcd1234', verification: verification
      )
      expect(result).to eq(true)
    end

    it 'rejects a tampered field' do
      secret = 'test-secret'
      verification = hmac_md5(secret, '1:true:10025:AUD:001-P-ABCDG1123:abcd1234')
      result = Hmac.verify_purchase_response(
        secret, response_code: '1', successful: 'true', amount: '99999',
        currency: 'AUD', id: '001-P-ABCDG1123', token: 'abcd1234', verification: verification
      )
      expect(result).to eq(false)
    end

    it 'rejects when signed with the wrong shared secret' do
      verification = hmac_md5('wrong-secret', '1:true:10025:AUD:001-P-ABCDG1123:abcd1234')
      result = Hmac.verify_purchase_response(
        'test-secret', response_code: '1', successful: 'true', amount: '10025',
        currency: 'AUD', id: '001-P-ABCDG1123', token: 'abcd1234', verification: verification
      )
      expect(result).to eq(false)
    end
  end

  describe '.verify_tokenize_response' do
    it 'verifies response_code:token' do
      secret = 'test-secret'
      verification = hmac_md5(secret, '1:abcd1234')
      result = Hmac.verify_tokenize_response(secret, response_code: '1', token: 'abcd1234', verification: verification)
      expect(result).to eq(true)
    end
  end
end
