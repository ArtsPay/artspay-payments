# ArtsPay Hosted Payment Page: HTML + Node.js

Embeds the ArtsPay hosted payment page in an iframe using the iframe + postMessage integration method: no page navigation, the result arrives as a browser event. One server, serving both the page and the API.

## Setup

```sh
npm install
```

Open `server.js` and replace `FZ_USERNAME` / `FZ_SHARED_SECRET` with your ArtsPay sandbox credentials.

## Run

```sh
npm start
```

Visit `http://localhost:3000`.

## Test

```sh
npm test
```
