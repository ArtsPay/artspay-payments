import os
import re
import time

import requests
from flask import Flask, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix

from payment_intent import build_payment_intent_verification
from payment_result import verify_payment_result

# Set FZ_USERNAME / FZ_SHARED_SECRET / FZ_OAUTH_ACCESS_KEY /
# FZ_OAUTH_ACCESS_SECRET as environment variables. The username is your
# ArtsPay merchant username; the shared secret is the same "Pay Now token"
# used to sign Hosted Payment Page URLs elsewhere in this repo, needed here
# to sign the PaymentIntent instead; the OAuth access key/secret come from
# a one-off download in the Merchant Dashboard (Settings -> OAuth Clients
# -> Create new OAuth Client) and are used only server-side to mint
# short-lived access tokens. Never hardcode real credentials here or
# commit them to a repository.
FZ_USERNAME = os.environ.get('FZ_USERNAME', '')
FZ_SHARED_SECRET = os.environ.get('FZ_SHARED_SECRET', '')
FZ_OAUTH_ACCESS_KEY = os.environ.get('FZ_OAUTH_ACCESS_KEY', '')
FZ_OAUTH_ACCESS_SECRET = os.environ.get('FZ_OAUTH_ACCESS_SECRET', '')

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)

PORT = int(os.environ.get('PORT', 8000))
OAUTH_HOST = 'https://api.pmnts-sandbox.io'
AMOUNT_PATTERN = re.compile(r'^\d+(\.\d{1,2})?$')


# fatzebra.js needs a fresh OAuth token (15-minute expiry) before it can run
# a 3DS2 check, so the frontend fetches this once per checkout rather than
# reusing one across sessions. The access key/secret used to mint it never
# reach the browser, only the resulting short-lived token does.
@app.get('/api/checkout-config')
def checkout_config():
    if not FZ_USERNAME or not FZ_SHARED_SECRET or not FZ_OAUTH_ACCESS_KEY or not FZ_OAUTH_ACCESS_SECRET:
        return jsonify(
            error='Set FZ_USERNAME, FZ_SHARED_SECRET, FZ_OAUTH_ACCESS_KEY and FZ_OAUTH_ACCESS_SECRET in server.py first.',
        ), 500

    raw_amount = request.args.get('amount', '')
    amount = raw_amount if AMOUNT_PATTERN.match(raw_amount) else '5.00'
    amount_cents = round(float(amount) * 100)

    token_res = requests.post(
        f'{OAUTH_HOST}/oauth/token',
        json={'access_key': FZ_OAUTH_ACCESS_KEY, 'access_secret': FZ_OAUTH_ACCESS_SECRET},
    )
    token_body = token_res.json()
    access_token = (token_body.get('data') or {}).get('token')
    if not token_res.ok or not access_token:
        return jsonify(error='Failed to obtain an OAuth access token', details=token_body), 502

    reference = f'order_{int(time.time() * 1000)}'
    currency = 'AUD'
    verification = build_payment_intent_verification(FZ_SHARED_SECRET, reference, amount_cents, currency)

    return jsonify(
        username=FZ_USERNAME, accessToken=access_token, amountCents=amount_cents,
        currency=currency, reference=reference, verification=verification,
    )


# fz.payment.success/fz.payment.error's own verification hash is untrusted
# until this endpoint confirms it: the shared secret needed to check it
# never reaches the browser.
@app.post('/api/verify-payment-result')
def verify_payment_result_route():
    data = request.get_json(silent=True) or {}
    verified = verify_payment_result(FZ_SHARED_SECRET, data)
    return jsonify(verified=verified)


if __name__ == '__main__':
    print(f'Listening on http://localhost:{PORT}')
    app.run(port=PORT)
