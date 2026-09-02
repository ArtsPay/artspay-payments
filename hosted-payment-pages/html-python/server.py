import os
import re
import time

from flask import Flask, jsonify, request

from hmac_utils import build_verification_hash, verify_purchase_response
from webhook import register_webhook

# Replace these with your ArtsPay sandbox credentials. You can also set
# them as FZ_USERNAME / FZ_SHARED_SECRET environment variables instead of
# editing this file, if you prefer.
FZ_USERNAME = os.environ.get('FZ_USERNAME', '')
FZ_SHARED_SECRET = os.environ.get('FZ_SHARED_SECRET', '')

app = Flask(__name__, static_url_path='', static_folder='public')

# Optional: see webhook.py. Adjust the path there to whatever your own
# webhook URL should be, or remove this line entirely if you don't need
# webhooks.
register_webhook(app)

PORT = int(os.environ.get('PORT', 3000))
HPP_BASE_URL = 'https://paynow.pmnts-sandbox.io/v3'

AMOUNT_PATTERN = re.compile(r'^\d+(\.\d{1,2})?$')


@app.get('/')
def index():
    return app.send_static_file('index.html')


# Returns a Hosted Payment Page URL for embedding in an iframe. Uses
# iframe=true&postmessage=true, not a redirect: the hosted page posts the
# result back to the parent window instead of navigating away.
@app.get('/api/checkout-url')
def checkout_url():
    if not FZ_USERNAME or not FZ_SHARED_SECRET:
        return jsonify(error='Set FZ_USERNAME and FZ_SHARED_SECRET in server.py first.'), 500

    raw_amount = request.args.get('amount', '')
    amount = raw_amount if AMOUNT_PATTERN.match(raw_amount) else '10.25'
    reference = f'order_{int(time.time() * 1000)}'
    currency = 'AUD'

    signature = build_verification_hash(FZ_SHARED_SECRET, reference, amount, currency)
    url = f'{HPP_BASE_URL}/{FZ_USERNAME}/{reference}/{currency}/{amount}/{signature}?iframe=true&postmessage=true'

    return jsonify(url=url)


# The postMessage payload is untrusted until this endpoint verifies it: the
# shared secret needed to check it never reaches the browser.
@app.post('/api/verify')
def verify():
    body = request.get_json(silent=True) or {}
    verified = verify_purchase_response(
        FZ_SHARED_SECRET,
        body.get('r'), body.get('successful'), body.get('amount'),
        body.get('currency'), body.get('id'), body.get('token'), body.get('v'),
    )

    return jsonify(verified=verified)


if __name__ == '__main__':
    print(f'Listening on http://localhost:{PORT}')
    app.run(port=PORT)
