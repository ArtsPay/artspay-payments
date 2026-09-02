import { useEffect, useState } from 'react';

// Must match the environment used to build the checkout URL (sandbox shown
// here; swap to https://paynow.pmnts.io for live).
const PAYMENT_HOST = 'https://paynow.pmnts-sandbox.io';

export default function App() {
  const [amount, setAmount] = useState('10.25');
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function startCheckout() {
    setError(null);
    const res = await fetch(`/api/checkout-url?amount=${encodeURIComponent(amount)}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to start checkout');
      return;
    }
    setCheckoutUrl(data.url);
  }

  useEffect(() => {
    // Adapted from Fat Zebra's documented IFRAME/postMessage listener.
    async function handleMessage(event) {
      if (event.origin !== PAYMENT_HOST) return;

      let payload = event.data;
      if (typeof payload === 'string') {
        // Older browsers deliver a query-string style payload instead of an object.
        const pairs = payload.split('&');
        payload = {};
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          payload[decodeURIComponent(key)] = decodeURIComponent(value || '');
        }
      }
      if (!payload || typeof payload !== 'object' || !('message' in payload)) return;

      if (payload.message === 'transaction.cancelled') {
        setCheckoutUrl(null);
        return;
      }

      if (payload.message !== 'transaction.complete') return;

      const purchase = payload.data;

      // The response is untrusted until the backend confirms the signature;
      // the shared secret needed to check it never reaches this page.
      const verifyRes = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchase),
      });
      const { verified } = await verifyRes.json();

      setCheckoutUrl(null);
      setResult({ purchase, verified, isSuccess: String(purchase.r) === '1' });
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      <h1>ArtsPay Hosted Payment Page: React example</h1>
      <p>
        Uses the iframe + postMessage integration method: no page navigation, the result arrives as a
        browser event that this page sends to the backend for verification before trusting it.
      </p>

      {!checkoutUrl && !result && (
        <div>
          <label>
            Amount (AUD) <input value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <button type="button" onClick={startCheckout}>Pay with ArtsPay</button>
          {error && <p>{error}</p>}
        </div>
      )}

      {checkoutUrl && (
        <iframe title="ArtsPay Checkout" src={checkoutUrl} style={{ width: '100%', height: 600, border: 0 }} />
      )}

      {result && (
        <div>
          <h2>{result.isSuccess ? 'Payment successful' : 'Payment not successful'}</h2>
          <p><strong>Response hash:</strong> {result.verified ? 'valid' : 'INVALID, do not trust this response'}</p>
          <pre>{JSON.stringify(result.purchase, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
