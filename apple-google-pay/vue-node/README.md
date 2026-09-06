# ArtsPay Apple Pay & Google Pay: Vue + Node.js

Native wallet integrations that charge directly through ArtsPay's purchase API instead of the
Hosted Payment Page. Apple Pay and Google Pay are independent of each other here: separate
components on the frontend, separate routes on the backend.

## Before you run

1. Register your Merchant ID and domain with Apple (Apple Pay only).
2. Deploy this app on that registered HTTPS domain (Apple Pay only; Google Pay runs fine on localhost).
3. Set `FZ_USERNAME` / `FZ_TOKEN` as environment variables to your ArtsPay sandbox credentials. Never hardcode real credentials into `server.js` or commit them to a repository.

## Setup

```sh
npm install
```

## Run

```sh
npm start
```

Runs the API (`http://localhost:8000`) and the Vite dev server together. Visit `http://localhost:3000`, it proxies `/api` and `/.well-known` to the backend, so the browser only ever talks to this one origin.

## Test

```sh
npm test
```

## Documentation

See the [ArtsPay Documentation and Guides](https://www.artspay.com/docs/guides) for the full
Apple Pay and Google Pay integration guides.
