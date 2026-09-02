# ArtsPay Hosted Payment Page: Next.js

Embeds the ArtsPay hosted payment page in an iframe using the iframe + postMessage integration method: no page navigation, the result arrives as a browser event that the page sends to an API route for verification before trusting it.

Next.js's App Router API routes act as the backend, so this is one process, one folder, unlike the other frontend/backend combos in this repo.

## Setup

```sh
npm install
```

Open `lib/config.js` and replace `FZ_USERNAME` / `FZ_SHARED_SECRET` with your ArtsPay sandbox credentials. You can also set them as environment variables (for example in `.env.local`, which Next.js loads automatically) instead of editing the file.

## Run

```sh
npm run dev
```

Visit `http://localhost:3000`.

## Test

```sh
npm test
```
