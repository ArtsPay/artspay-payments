# ArtsPay Hosted Payment Page: React + Node.js

Embeds the ArtsPay hosted payment page in an iframe using the iframe + postMessage integration method: no page navigation, the result arrives as a browser event that the frontend sends to the backend for verification before trusting it.

## Setup

```sh
npm install
```

Open `server.js` and replace `FZ_USERNAME` / `FZ_SHARED_SECRET` with your ArtsPay sandbox credentials.

## Run

```sh
npm start
```

Runs the API (`http://localhost:8000`) and the Vite dev server together. Visit `http://localhost:3000`, it proxies `/api` and `/webhooks` to the backend, so the browser only ever talks to this one origin.

## Test

```sh
npm test
```
