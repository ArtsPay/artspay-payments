export function basicAuthHeader(username, apiToken) {
  return 'Basic ' + Buffer.from(`${username}:${apiToken}`).toString('base64');
}
