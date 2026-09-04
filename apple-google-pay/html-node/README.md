# ArtsPay Apple Pay & Google Pay: HTML + Node.js

Native wallet integrations that charge directly through ArtsPay's purchase API instead of the
Hosted Payment Page. One server, serving both the page and the API. Apple Pay and Google Pay
are independent of each other here: separate routes, separate scripts, separate buttons.

## Before you run

1. Register your Merchant ID and domain with Apple (Apple Pay only).
2. Deploy this server on that registered HTTPS domain (Apple Pay only; Google Pay runs fine on localhost).
3. Set `FZ_USERNAME` / `FZ_TOKEN` as environment variables to your ArtsPay sandbox credentials. Never hardcode real credentials into `server.js` or commit them to a repository.

## Setup

```sh
npm install
```

## Run

```sh
npm start
```

Visit `http://localhost:3000`.

## Test

```sh
npm test
```

## Documentation

See the [ArtsPay Documentation and Guides](https://www.artspay.com/docs/guides) for the full
Apple Pay and Google Pay integration guides.
