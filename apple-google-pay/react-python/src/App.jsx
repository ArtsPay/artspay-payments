import { useState } from 'react';
import ApplePayButton from './ApplePayButton.jsx';
import GooglePayButton from './GooglePayButton.jsx';

export default function App() {
  const [amount, setAmount] = useState('10.00');
  const [result, setResult] = useState(null);

  function handleResult(successful, data) {
    setResult({ successful, data });
  }

  return (
    <>
      <h1>ArtsPay Apple Pay & Google Pay: React example</h1>
      <p>
        Both wallets charge directly through ArtsPay's purchase API instead of the Hosted Payment Page.
        Apple Pay only renders in Safari, over HTTPS, on a domain registered with Apple (see README).
        Google Pay needs a browser the Google Pay API supports and a Google account with a saved card.
      </p>
      <p>
        Sandbox responses are cent-based: the cents of the amount become the simulated response
        code, e.g. <code>10.05</code> declines with code <code>05</code>, <code>10.00</code>
        approves. See the <a href="https://artspay.com/docs/guides/apple-pay-web">Apple Pay</a>{' '}
        / <a href="https://artspay.com/docs/guides/google-pay-web">Google Pay</a> guides' Testing sections.
      </p>

      <label>
        Amount (AUD) <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      <br /><br />

      <ApplePayButton amount={amount} onResult={handleResult} />
      <GooglePayButton amount={amount} onResult={handleResult} />

      {result && (
        <div>
          <h2>{result.successful ? 'Payment successful' : 'Payment not successful'}</h2>
          <pre>{JSON.stringify(result.data, null, 2)}</pre>
        </div>
      )}
    </>
  );
}
