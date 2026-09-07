# ArtsPay Tokenisation: Vue + Python

Two independent flows: saving a card via the Hosted Payment Page's tokenize-only mode, and
charging a previously saved token directly through ArtsPay's purchase API. Card data never
touches this server either way.

One folder, two processes running at once.

## Before you run

Set `FZ_USERNAME` / `FZ_SHARED_SECRET` / `FZ_TOKEN` as environment variables to your ArtsPay
sandbox credentials. Never hardcode real credentials into `server.py` or commit them to a
repository. Saving a card needs the shared secret, since it signs the Hosted Payment Page URL;
charging a token needs the API token, used for HTTP Basic Auth against Fat Zebra's Gateway API.
These are two different credential pairs on your ArtsPay account.

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

Visit `http://localhost:3000`. Vite proxies `/api` to the backend, so the browser only ever talks to this dev server, not the backend directly.

## Test

```sh
python -m pytest -v
```

## Documentation

See the [ArtsPay Documentation and Guides](https://www.artspay.com/docs/guides) for the full
Tokenisation guide.
