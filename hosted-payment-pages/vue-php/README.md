# ArtsPay Hosted Payment Page: Vue + PHP

Embeds the ArtsPay hosted payment page in an iframe using the iframe + postMessage integration method: no page navigation, the result arrives as a browser event that the frontend sends to the backend for verification before trusting it.

One folder, two processes running at once.

## Terminal 1: backend

```sh
composer install
```

Open `server.php` and replace `FZ_USERNAME` / `FZ_SHARED_SECRET` with your ArtsPay sandbox credentials.

```sh
composer start
```

Listens on `http://localhost:8000`.

## Terminal 2: frontend

```sh
npm install
npm run dev
```

Visit `http://localhost:3000`. Vite proxies `/api` and `/webhooks` to the backend, so the browser only ever talks to this dev server, not the backend directly.

## Test

```sh
composer test
```
