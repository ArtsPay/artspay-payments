// Set FZ_USERNAME / FZ_TOKEN as environment variables (for example in
// .env.local, which Next.js loads automatically) to your ArtsPay sandbox
// API username and token, used for HTTP Basic Auth against Fat Zebra's
// PayNow/Gateway APIs. Never hardcode real credentials here or commit them
// to a repository.
export const FZ_USERNAME = process.env.FZ_USERNAME || '';
export const FZ_TOKEN = process.env.FZ_TOKEN || '';
