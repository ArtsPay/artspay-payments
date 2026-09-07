// Fat Zebra requires customer_ip on every direct purchase call. Next.js
// Route Handlers don't expose the connecting socket's address directly, so
// the real client IP has to come from a header instead, same as behind any
// reverse proxy.
export function getCustomerIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
