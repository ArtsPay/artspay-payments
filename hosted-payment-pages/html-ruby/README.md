# ArtsPay Hosted Payment Page: HTML + Ruby

Embeds the ArtsPay hosted payment page in an iframe using the iframe + postMessage integration method: no page navigation, the result arrives as a browser event. One server, serving both the page and the API.

## Setup

```sh
bundle install
```

Open `server.rb` and replace `FZ_USERNAME` / `FZ_SHARED_SECRET` with your ArtsPay sandbox credentials.

## Run

```sh
bundle exec ruby server.rb
```

Visit `http://localhost:3000`.

## Test

```sh
bundle exec rspec
```
