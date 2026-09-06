# ArtsPay Apple Pay & Google Pay: React + Python

Native wallet integrations that charge directly through ArtsPay's purchase API instead of the
Hosted Payment Page. Apple Pay and Google Pay are independent of each other here: separate
components on the frontend, separate routes on the backend.

One folder, two processes running at once.

## Before you run

1. Register your Merchant ID and domain with Apple (Apple Pay only).
2. Deploy this app on that registered HTTPS domain (Apple Pay only; Google Pay runs fine on localhost).
3. Set `FZ_USERNAME` / `FZ_TOKEN` as environment variables to your ArtsPay sandbox credentials. Never hardcode real credentials into `server.py` or commit them to a repository.

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

Visit `http://localhost:3000`. Vite proxies `/api` and `/.well-known` to the backend, so the browser only ever talks to this dev server, not the backend directly.

## Test

```sh
python -m pytest -v
```

## Documentation

See the [ArtsPay Documentation and Guides](https://www.artspay.com/docs/guides) for the full
Apple Pay and Google Pay integration guides.
