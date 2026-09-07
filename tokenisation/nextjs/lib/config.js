// Set FZ_USERNAME / FZ_SHARED_SECRET / FZ_TOKEN as environment variables
// (for example in .env.local, which Next.js loads automatically) to your
// ArtsPay sandbox credentials. The shared secret signs the Hosted Payment
// Page save-a-card request; the API token is a separate credential used for
// HTTP Basic Auth when charging a stored token directly. Never hardcode
// real credentials here or commit them to a repository.
export const FZ_USERNAME = process.env.FZ_USERNAME || '';
export const FZ_SHARED_SECRET = process.env.FZ_SHARED_SECRET || '';
export const FZ_TOKEN = process.env.FZ_TOKEN || '';
