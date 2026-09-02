# ArtsPay Hosted Payment Page: HTML + Python

Embeds the ArtsPay hosted payment page in an iframe using the iframe + postMessage integration method: no page navigation, the result arrives as a browser event. One server, serving both the page and the API.

## Setup

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Open `server.py` and replace `FZ_USERNAME` / `FZ_SHARED_SECRET` with your ArtsPay sandbox credentials.

## Run

```sh
python server.py
```

Visit `http://localhost:3000`.

## Test

```sh
python -m pytest -v
```
