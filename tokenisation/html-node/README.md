# ArtsPay Tokenisation: HTML + Node.js

Two independent flows: saving a card via the Hosted Payment Page's tokenize-only mode, and
charging a previously saved token directly through ArtsPay's purchase API. Card data never
touches this server either way.

## Before you run

Set `FZ_USERNAME` / `FZ_SHARED_SECRET` / `FZ_TOKEN` as environment variables to your ArtsPay
sandbox credentials. Never hardcode real credentials into `server.js` or commit them to a
repository. Saving a card needs the shared secret, since it signs the Hosted Payment Page URL;
charging a token needs the API token, used for HTTP Basic Auth against Fat Zebra's Gateway API.
These are two different credential pairs on your ArtsPay account.

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
Tokenisation guide.
