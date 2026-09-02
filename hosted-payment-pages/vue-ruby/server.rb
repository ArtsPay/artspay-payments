require 'sinatra'
require 'json'
require_relative 'hmac'
require_relative 'webhook'

# Replace these with your ArtsPay sandbox credentials. You can also set
# them as FZ_USERNAME / FZ_SHARED_SECRET environment variables instead of
# editing this file, if you prefer.
FZ_USERNAME = ENV['FZ_USERNAME'] || ''
FZ_SHARED_SECRET = ENV['FZ_SHARED_SECRET'] || ''

set :port, (ENV['PORT'] || 8000)
HPP_BASE_URL = 'https://paynow.pmnts-sandbox.io/v3'
AMOUNT_PATTERN = /\A\d+(\.\d{1,2})?\z/

# Returns a Hosted Payment Page URL for embedding in an iframe. Uses
# iframe=true&postmessage=true, not a redirect: the hosted page posts the
# result back to the parent window instead of navigating away.
get '/api/checkout-url' do
  content_type :json

  if FZ_USERNAME.empty? || FZ_SHARED_SECRET.empty?
    halt 500, { error: 'Set FZ_USERNAME and FZ_SHARED_SECRET in server.rb first.' }.to_json
  end

  amount = params['amount']
  amount = '10.25' unless amount =~ AMOUNT_PATTERN
  reference = "order_#{(Time.now.to_f * 1000).to_i}"
  currency = 'AUD'

  hash = Hmac.build_verification_hash(FZ_SHARED_SECRET, reference: reference, amount: amount, currency: currency)
  url = "#{HPP_BASE_URL}/#{FZ_USERNAME}/#{reference}/#{currency}/#{amount}/#{hash}?iframe=true&postmessage=true"

  { url: url }.to_json
end

# The postMessage payload is untrusted until this endpoint verifies it: the
# shared secret needed to check it never reaches the browser.
post '/api/verify' do
  content_type :json
  body = JSON.parse(request.body.read)

  verified = Hmac.verify_purchase_response(
    FZ_SHARED_SECRET,
    response_code: body['r'], successful: body['successful'], amount: body['amount'],
    currency: body['currency'], id: body['id'], token: body['token'], verification: body['v'],
  )

  { verified: verified }.to_json
end

# Optional: see webhook.rb. Adjust the path to whatever your own webhook
# URL should be, or remove this block entirely if you don't need webhooks.
post '/webhooks' do
  body = JSON.parse(request.body.read)
  Webhook.handle(body)
  status 200
end
