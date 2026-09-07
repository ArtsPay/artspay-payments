# ArtsPay 3D Secure (fatzebra.js): React + Python

Renders ArtsPay's Hosted Payments Page through fatzebra.js with 3D Secure 2 enabled
(`enableSca: true`). This is "Path A" from the 3D Secure guide: fatzebra.js tokenizes the
card, runs the 3DS2 check, then submits the purchase itself. Your backend only ever mints a
short-lived OAuth access token and signs the request/response hashes; it never sees the card
directly.

One folder, two processes running at once.

## Before you run

1. Contact ArtsPay support to have 3D Secure 2 enabled on your account.
2. In the Merchant Dashboard, go to **Settings → OAuth Clients → Create new OAuth Client** and download the access key / access secret (a one-off download, so save them securely).
3. Set `FZ_USERNAME` / `FZ_SHARED_SECRET` / `FZ_OAUTH_ACCESS_KEY` / `FZ_OAUTH_ACCESS_SECRET` as environment variables to your ArtsPay sandbox credentials. Never hardcode real credentials into `server.py` or commit them to a repository. `FZ_SHARED_SECRET` is the same "Pay Now token" used to sign Hosted Payment Page URLs elsewhere in this repo, needed here to sign the `PaymentIntent` instead; the OAuth pair is a third, separate credential again.

## Terminal 1: backend

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

Listens on `http://localhost:8000`.

## Terminal 2: frontend

```sh
npm install
npm run dev
```

Visit `http://localhost:3000`. Vite proxies `/api` to the backend, so the browser only ever talks to this dev server, not the backend directly. Enter one of the [3DS2 test cards](https://artspay.com/docs/guides/3d-secure#testing) from the guide to see a specific outcome (frictionless, step-up, decline). No HTTPS needed, even locally.

## Known gotchas

Fat Zebra's own SDK documentation has a couple of inaccuracies that cost real debugging time
building this example, worth knowing before you hit them yourself:

- **`PaymentIntent.verification` must be a real HMAC**, not the placeholder-looking string
  Fat Zebra's own `renderPaymentsPage`/`verifyCard` doc examples show (`'ver_123480'`). An
  invalid value here makes fatzebra.js show "Sorry, we were unable to verify the data..." on
  screen, and can also throw a blocked-frame console error that looks like an unrelated HTTPS
  problem but isn't. See `payment_intent.py` for the real formula.
- **`fz.on()` event payloads are nested under `event.detail`**, not directly on the event
  object as the SDK docs' own JSON examples show. `fz.payment.success`/`fz.payment.error`'s
  data is at `event.detail.data`, confirmed against a real sandbox transaction. See
  `payment_result.py` and the comments in `src/App.jsx`.

## Test

```sh
python -m pytest -v
```

Two hashes have real logic worth unit testing: the outgoing `PaymentIntent.verification`
(`payment_intent.py`), whose test expectations come from Fat Zebra's own documented worked
example, and the incoming `fz.payment.success`/`fz.payment.error` result verification
(`payment_result.py`), whose test expectations are an independently-computed HMAC instead,
since Fat Zebra's own worked example for that one turned out to be internally inconsistent.
The OAuth token exchange and the rest of `renderPaymentsPage` are exercised by actually using
the page against the sandbox.

## Documentation

See the [ArtsPay Documentation and Guides](https://www.artspay.com/docs/guides) for the full
3D Secure guide.
