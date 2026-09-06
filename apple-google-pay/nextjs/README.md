# ArtsPay Apple Pay & Google Pay: Next.js

Native wallet integrations that charge directly through ArtsPay's purchase API instead of the
Hosted Payment Page. Next.js's App Router API routes act as the backend, so this is one process,
one folder, unlike the other frontend/backend combos in this repo. Apple Pay and Google Pay are
independent of each other here: separate components, separate routes.

## Before you run

1. Register your Merchant ID and domain with Apple (Apple Pay only).
2. Deploy this app on that registered HTTPS domain (Apple Pay only; Google Pay runs fine on localhost).
3. Set `FZ_USERNAME` / `FZ_TOKEN` as environment variables (for example in `.env.local`, which Next.js loads automatically) to your ArtsPay sandbox credentials. Never hardcode real credentials into `lib/config.js` or commit them to a repository.

## Setup

```sh
npm install
```

## Run

```sh
npm run dev
```

Visit `http://localhost:3000`.

## Test

```sh
npm test
```

## Documentation

See the [ArtsPay Documentation and Guides](https://www.artspay.com/docs/guides) for the full
Apple Pay and Google Pay integration guides.
