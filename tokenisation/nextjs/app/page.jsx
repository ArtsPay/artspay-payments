'use client';

import { useEffect, useState } from 'react';

// Must match the environment used to build the checkout URL (sandbox shown
// here; swap to https://paynow.pmnts.io for live).
const PAYMENT_HOST = 'https://paynow.pmnts-sandbox.io';

export default function Home() {
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [saveResult, setSaveResult] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const [token, setToken] = useState('');
  const [chargeAmount, setChargeAmount] = useState('10.00');
  const [recurring, setRecurring] = useState(false);
  const [chargeResult, setChargeResult] = useState(null);

  async function startSaveCard() {
    setSaveError(null);
    const res = await fetch('/api/checkout-url');
    const data = await res.json();
    if (!res.ok) {
      setSaveError(data.error || 'Failed to start');
      return;
    }
    setCheckoutUrl(data.url);
  }

  useEffect(() => {
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

      // tokenize_only mode has its own message name, fz.tokenization.success,
      // rather than the transaction.complete used by a normal purchase
      // (confirmed against the sandbox; other messages like
      // transaction.processing, form.invalid and resize are ignored here).
      if (payload.message !== 'fz.tokenization.success') return;

      const saved = payload.data;

      // The response is untrusted until the backend confirms the signature;
      // the shared secret needed to check it never reaches this page.
      const verifyRes = await fetch('/api/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saved),
      });
      const result = await verifyRes.json();

      setCheckoutUrl(null);
      setSaveResult(result);
      if (result.verified && result.token) {
        setToken(result.token);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  async function chargeToken() {
    const res = await fetch('/api/charge-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardToken: token,
        amount: chargeAmount,
        reference: `order_${Date.now()}`,
        recurring,
      }),
    });
    const data = await res.json();
    setChargeResult({ successful: res.ok && data.successful, data });
  }

  return (
    <>
      <h1>ArtsPay Tokenisation: Next.js example</h1>
      <p>
        Two independent flows: saving a card via the Hosted Payment Page's tokenize-only mode
        (no charge, no raw card number touches this server), and charging a previously saved
        token directly through ArtsPay's purchase API, which is what a server does on its own
        for a renewal.
      </p>

      <h2>1. Save a card</h2>
      {!checkoutUrl && (
        <div>
          <button type="button" onClick={startSaveCard}>Save a card</button>
          {saveError && <p>{saveError}</p>}
        </div>
      )}
      {checkoutUrl && (
        <iframe title="ArtsPay Save Card" src={checkoutUrl} style={{ width: '100%', height: 600, border: 0 }} />
      )}
      {saveResult && (
        <div>
          <h3>{saveResult.verified ? 'Success' : 'Not successful'}</h3>
          <pre>{JSON.stringify(saveResult, null, 2)}</pre>
        </div>
      )}

      <h2>2. Charge a saved token</h2>
      <p>Paste in a token from step 1 (or one you already have) and charge it directly.</p>
      <label>
        Token <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="e.g. fke8jmra" />
      </label>
      <br /><br />
      <label>
        Amount (AUD) <input value={chargeAmount} onChange={(e) => setChargeAmount(e.target.value)} />
      </label>
      <br /><br />
      <label>
        <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
        {' '}This is a subsequent recurring charge
      </label>
      <br /><br />
      <button type="button" onClick={chargeToken}>Charge token</button>
      {chargeResult && (
        <div>
          <h3>{chargeResult.successful ? 'Success' : 'Not successful'}</h3>
          <pre>{JSON.stringify(chargeResult.data, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
