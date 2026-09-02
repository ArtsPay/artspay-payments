# ArtsPay.com Payment Examples

Working, runnable code examples for integrating ArtsPay payments, organised by integration, then by stack combination.

```
<integration>/<frontend>-<backend>/
```

For example, `hosted-payment-pages/html-node/` is a complete, self-contained example: clone it, install, run, done. No shared files between examples, no cross-referencing, each one stands alone.

## Documentation

These are companions to the step-by-step guides at [artspay.com/docs/guides](https://artspay.com/docs/guides), not a replacement for them: the guides explain the concepts, this repo has something you can actually clone and run against the ArtsPay sandbox.

## Available examples

| Integration | Examples |
| :--- | :--- |
| Hosted Payment Pages | [HTML + Node.js](hosted-payment-pages/html-node), [HTML + Python](hosted-payment-pages/html-python), [HTML + PHP](hosted-payment-pages/html-php), [HTML + Ruby](hosted-payment-pages/html-ruby), [React + Node.js](hosted-payment-pages/react-node), [React + Python](hosted-payment-pages/react-python), [React + PHP](hosted-payment-pages/react-php), [React + Ruby](hosted-payment-pages/react-ruby), [Vue + Node.js](hosted-payment-pages/vue-node), [Vue + Python](hosted-payment-pages/vue-python), [Vue + PHP](hosted-payment-pages/vue-php), [Vue + Ruby](hosted-payment-pages/vue-ruby), [Next.js](hosted-payment-pages/nextjs) |

More stacks and integrations (Apple Pay, Google Pay, Tokenisation, 3D Secure) will be added over time.

## Running an example

Each example directory has its own README with everything needed, no need to read anything else first. There's no `.env` file to set up: open `server.js` / `server.py` / `server.php` / `server.rb` / `lib/config.js` and set `FZ_USERNAME` / `FZ_SHARED_SECRET` at the top to your ArtsPay **sandbox** credentials, never live ones. Left blank, the server still starts but returns a clear error instead of a broken checkout URL.

Every combo is one folder, matching how Stripe's own samples are structured, no `backend/`/`frontend/` split anywhere. The plain-HTML examples are a single process on `http://localhost:3000`. The React/Vue examples run two processes: the frontend is always `http://localhost:3000`, the backend is always `http://localhost:8000` (not 5000, that's claimed by macOS's AirPlay Receiver on most Macs). `npm install && npm start` runs both at once for the Node.js pairs (one `package.json` holds both sets of dependencies, `concurrently` runs both scripts, same as Stripe's own React+Node sample); the Python, PHP, and Ruby pairs need two terminals, since there's no equivalent to reach into those processes from an npm script. Either way, Vite proxies API calls to the backend, so the browser only ever talks to `:3000` and there's no CORS to think about.

Next.js is the odd one out: it's not a frontend/backend combo, its own API routes (`app/api/`) are the backend, so it's a single process on `http://localhost:3000`, `npm install && npm run dev`, nothing to proxy.

## Local development

For working across several examples without hand-editing credentials into each one, `FZ_USERNAME` / `FZ_SHARED_SECRET` environment variables override the placeholder constants if set. Keep your sandbox credentials in a `.env` at the repo root (gitignored) and source it before running or testing an example:

```sh
set -a && source .env && set +a
```

This is purely a development convenience; the shipped example files never read a `.env` themselves.

## Contributing

- Every example must run end to end against the ArtsPay sandbox before it's merged, not just typecheck or lint clean.
- Never commit real credentials, even sandbox ones, and never edit the placeholder constants in an example file to a real value before committing.
- Each example is self-contained on purpose. A little duplication between examples (e.g. the same HMAC logic copied into every Node.js backend) is the deliberate tradeoff for that, don't factor it out into a shared module.
- Work directly on `main` in small, working increments; push only once an example (or change) has been run and smoke-tested locally.

## License

MIT, see [LICENSE](LICENSE).