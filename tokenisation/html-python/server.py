import os
import time

import requests
from flask import Flask, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix

from hmac_utils import build_verification_hash, verify_tokenize_response

# Set FZ_USERNAME / FZ_SHARED_SECRET / FZ_TOKEN as environment variables to
# your ArtsPay sandbox credentials. The shared secret signs the Hosted
# Payment Page save-a-card request; the API token is a separate credential
# used for HTTP Basic Auth when charging a stored token directly. Never
# hardcode real credentials here or commit them to a repository.
FZ_USERNAME = os.environ.get('FZ_USERNAME', '')
FZ_SHARED_SECRET = os.environ.get('FZ_SHARED_SECRET', '')
FZ_TOKEN = os.environ.get('FZ_TOKEN', '')

app = Flask(__name__, static_url_path='', static_folder='public')
# Fat Zebra requires customer_ip on every direct purchase call; behind a
# proxy/load balancer the real client IP is in X-Forwarded-For, not the
# socket address.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)

PORT = int(os.environ.get('PORT', 3000))
HPP_BASE_URL = 'https://paynow.pmnts-sandbox.io/v3'
GATEWAY_HOST = 'https://gateway.pmnts-sandbox.io'


@app.get('/')
def index():
    return app.send_static_file('index.html')


# ── Save a card (tokenize only, no charge) ──────────────────────────────
# Same iframe + postMessage pattern as the Hosted Payment Pages example,
# with tokenize_only=true so the card is stored but never charged. See
# https://artspay.com/docs/guides/hosted-payment-pages for that base pattern.

# The nominal amount shown on the hosted page during tokenize-only mode is
# never actually captured.
@app.get('/api/checkout-url')
def checkout_url():
    if not FZ_USERNAME or not FZ_SHARED_SECRET:
        return jsonify(error='Set FZ_USERNAME and FZ_SHARED_SECRET in server.py first.'), 500

    reference = f'card_{int(time.time() * 1000)}'
    amount = '1.00'
    currency = 'AUD'

    signature = build_verification_hash(FZ_SHARED_SECRET, reference, amount, currency)
    url = (
        f'{HPP_BASE_URL}/{FZ_USERNAME}/{reference}/{currency}/{amount}/{signature}'
        '?iframe=true&postmessage=true&tokenize_only=true'
    )
    return jsonify(url=url)


# The postMessage payload is untrusted until this endpoint verifies it: the
# shared secret needed to check it never reaches the browser. Tokenize-only
# responses sign response_code:token, not the full purchase field set.
@app.post('/api/verify-token')
def verify_token():
    body = request.get_json(silent=True) or {}
    token = body.get('token')
    verified = verify_tokenize_response(FZ_SHARED_SECRET, body.get('r'), token, body.get('v'))
    return jsonify(verified=verified, token=token)


# ── Charge a saved token later ───────────────────────────────────────────
# This is what a server does on its own for a subscription renewal or
# repeat purchase; there's no browser flow for it, just a stored token.
@app.post('/api/charge-token')
def charge_token():
    if not FZ_USERNAME or not FZ_TOKEN:
        return jsonify(error='Set FZ_USERNAME and FZ_TOKEN in server.py first.'), 500

    body = request.get_json(silent=True) or {}
    payload = {
        'amount': round(float(body.get('amount')) * 100),
        'currency': 'AUD',
        'card_token': body.get('cardToken'),
        'reference': body.get('reference'),
        'customer_ip': request.remote_addr,
    }
    # The recurring/instalment fields from the Tokenisation guide: set when
    # this is a later charge in a series, not the customer's original
    # card-present transaction.
    if body.get('recurring'):
        payload['extra'] = {'ecm': 32, 'stored_credential_indicator': 'S'}

    upstream = requests.post(
        f'{GATEWAY_HOST}/v1.0/purchases',
        auth=(FZ_USERNAME, FZ_TOKEN),
        json=payload,
    )
    return upstream.json(), upstream.status_code


if __name__ == '__main__':
    print(f'Listening on http://localhost:{PORT}')
    app.run(port=PORT)
