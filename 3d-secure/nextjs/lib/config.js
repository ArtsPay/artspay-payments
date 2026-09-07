// Set FZ_USERNAME / FZ_SHARED_SECRET / FZ_OAUTH_ACCESS_KEY /
// FZ_OAUTH_ACCESS_SECRET as environment variables (for example in
// .env.local, which Next.js loads automatically). The username is your
// ArtsPay merchant username; the shared secret is the same "Pay Now token"
// used to sign Hosted Payment Page URLs elsewhere in this repo, needed here
// to sign the PaymentIntent instead; the OAuth access key/secret come from
// a one-off download in the Merchant Dashboard (Settings -> OAuth Clients
// -> Create new OAuth Client) and are used only server-side to mint
// short-lived access tokens. Never hardcode real credentials here or
// commit them to a repository.
export const FZ_USERNAME = process.env.FZ_USERNAME || '';
export const FZ_SHARED_SECRET = process.env.FZ_SHARED_SECRET || '';
export const FZ_OAUTH_ACCESS_KEY = process.env.FZ_OAUTH_ACCESS_KEY || '';
export const FZ_OAUTH_ACCESS_SECRET = process.env.FZ_OAUTH_ACCESS_SECRET || '';
