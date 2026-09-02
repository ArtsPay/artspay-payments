# ArtsPay Hosted Payment Page: HTML + PHP

Embeds the ArtsPay hosted payment page in an iframe using the iframe + postMessage integration method: no page navigation, the result arrives as a browser event. One server, serving both the page and the API.

## Setup

```sh
composer install
```

Open `server.php` and replace `FZ_USERNAME` / `FZ_SHARED_SECRET` with your ArtsPay sandbox credentials.

## Run

```sh
composer start
```

Visit `http://localhost:3000`.

## Test

```sh
composer test
```
