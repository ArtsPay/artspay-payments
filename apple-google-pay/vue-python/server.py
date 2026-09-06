import json
import os

import requests
from flask import Flask, jsonify, request
from werkzeug.middleware.proxy_fix import ProxyFix

from apple_pay import apple_is_valid_merchant_validation_url
from google_pay import google_derive_gateway_merchant_id

# Set FZ_USERNAME / FZ_TOKEN as environment variables to your ArtsPay
# sandbox API username and token, used for HTTP Basic Auth against Fat
# Zebra's PayNow/Gateway APIs. Never hardcode real credentials here or
# commit them to a repository.
FZ_USERNAME = os.environ.get('FZ_USERNAME', '')
FZ_TOKEN = os.environ.get('FZ_TOKEN', '')

app = Flask(__name__)
# Fat Zebra requires customer_ip on every purchase; behind a proxy/load
# balancer the real client IP is in X-Forwarded-For, not the socket address.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1)

PORT = int(os.environ.get('PORT', 8000))
SESSION_HOST = 'https://paynow.pmnts-sandbox.io'
GATEWAY_HOST = 'https://gateway.pmnts-sandbox.io'


def credentials_missing():
    return not FZ_USERNAME or not FZ_TOKEN


# Shared by both wallets: same purchase endpoint, same auth, only the
# `wallet` object differs.
def charge_wallet(wallet, amount, reference, customer_ip):
    return requests.post(
        f'{GATEWAY_HOST}/v1.0/purchases',
        auth=(FZ_USERNAME, FZ_TOKEN),
        json={
            'amount': round(float(amount) * 100),
            'currency': 'AUD',
            'reference': reference,
            'customer_ip': customer_ip,
            'wallet': wallet,
        },
    )


# ── Apple Pay ────────────────────────────────────────────────────────────
# To remove: delete this section and apple_pay.py on the backend, and
# src/ApplePayButton.vue + its usage in src/App.vue on the frontend.

# Apple looks for this file at /.well-known/apple-developer-merchantid-domain-association
# on your real domain, once, as part of registering the domain (see README).
@app.get('/.well-known/apple-developer-merchantid-domain-association')
def apple_pay_domain_association():
    file = (
        'https://paynow.pmnts.io/apple_pay/domain_verification/production.txt'
        if os.environ.get('FLASK_ENV') == 'production'
        else 'https://paynow.pmnts.io/apple_pay/domain_verification/sandbox.txt'
    )
    upstream = requests.get(file)
    return upstream.text, upstream.status_code, {'Content-Type': 'text/plain'}


# The browser's session.onvalidatemerchant handler posts Apple's
# validationURL here. We check it's really an Apple host, then call Fat
# Zebra's Get Apple Pay Session endpoint and hand back the opaque session.
@app.post('/api/apple-pay/session')
def apple_pay_session():
    if credentials_missing():
        return jsonify(error='Set FZ_USERNAME and FZ_TOKEN in server.py first.'), 500

    body = request.get_json(silent=True) or {}
    validation_url = body.get('validationURL')
    if not apple_is_valid_merchant_validation_url(validation_url):
        return jsonify(error='validationURL is not an Apple Pay domain'), 400

    upstream = requests.get(
        f'{SESSION_HOST}/v2/apple_pay/payment_session',
        params={
            'url': validation_url,
            'domain_name': request.host,
            'display_name': 'ArtsPay Example Store',
        },
        auth=(FZ_USERNAME, FZ_TOKEN),
    )
    return upstream.json(), upstream.status_code


# The browser's session.onpaymentauthorized handler posts the encrypted
# payment token here once the customer authorizes with Face ID/Touch ID.
@app.post('/api/apple-pay/charge')
def apple_pay_charge():
    if credentials_missing():
        return jsonify(error='Set FZ_USERNAME and FZ_TOKEN in server.py first.'), 500

    body = request.get_json(silent=True) or {}
    upstream = charge_wallet(
        {'type': 'APPLEPAYWEB', 'token': body.get('token')},
        body.get('amount'), body.get('reference'), request.remote_addr,
    )
    return upstream.json(), upstream.status_code


# ── Google Pay ───────────────────────────────────────────────────────────
# To remove: delete this section and google_pay.py on the backend, and
# src/GooglePayButton.vue + its usage in src/App.vue on the frontend.

# The frontend fetches this once to configure tokenizationSpecification; see
# https://artspay.com/docs/guides/google-pay-web.
@app.get('/api/google-pay/config')
def google_pay_config():
    if credentials_missing():
        return jsonify(error='Set FZ_USERNAME and FZ_TOKEN in server.py first.'), 500
    return jsonify(gatewayMerchantId=google_derive_gateway_merchant_id(FZ_USERNAME, FZ_TOKEN))


# paymentData.paymentMethodData.tokenizationData.token from Google's
# loadPaymentData() is a JSON string; parse it before sending it on.
@app.post('/api/google-pay/charge')
def google_pay_charge():
    if credentials_missing():
        return jsonify(error='Set FZ_USERNAME and FZ_TOKEN in server.py first.'), 500

    body = request.get_json(silent=True) or {}
    upstream = charge_wallet(
        {'type': 'GOOGLE', 'token': json.loads(body.get('token'))},
        body.get('amount'), body.get('reference'), request.remote_addr,
    )
    return upstream.json(), upstream.status_code


if __name__ == '__main__':
    print(f'Listening on http://localhost:{PORT}')
    app.run(port=PORT)
