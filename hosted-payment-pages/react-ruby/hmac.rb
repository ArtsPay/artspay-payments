require 'openssl'

module Hmac
  def self.hmac_md5_hex(shared_secret, message)
    OpenSSL::HMAC.hexdigest('MD5', shared_secret, message)
  end

  # Builds the verification hash for a V3 Hosted Payment Page request URL.
  # Field order matters: reference, amount, currency, then hide_card_holder
  # and return_path if present. See the Hosted Payment Pages guide at
  # artspay.com/docs/guides for the full signing scheme.
  def self.build_verification_hash(shared_secret, reference:, amount:, currency:, hide_card_holder: false, return_path: nil)
    parts = [reference, amount, currency]
    parts << 'true' if hide_card_holder
    parts << return_path unless return_path.to_s.empty?
    hmac_md5_hex(shared_secret, parts.join(':'))
  end

  # Verifies a purchase response's `v` param against response_code:successful:amount:currency:id:token.
  def self.verify_purchase_response(shared_secret, response_code:, successful:, amount:, currency:, id:, token:, verification:)
    expected = hmac_md5_hex(shared_secret, "#{response_code}:#{successful}:#{amount}:#{currency}:#{id}:#{token}")
    secure_compare(expected, verification.to_s)
  end

  # Verifies a tokenize-only response's `v` param against response_code:token.
  def self.verify_tokenize_response(shared_secret, response_code:, token:, verification:)
    expected = hmac_md5_hex(shared_secret, "#{response_code}:#{token}")
    secure_compare(expected, verification.to_s)
  end

  def self.secure_compare(a, b)
    return false unless a.bytesize == b.bytesize

    OpenSSL.fixed_length_secure_compare(a, b)
  end
end
