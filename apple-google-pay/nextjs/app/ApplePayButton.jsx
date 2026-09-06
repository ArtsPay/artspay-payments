'use client';

import { useEffect, useState } from 'react';

// Apple Pay (Web): native ApplePaySession flow, charged directly through
// ArtsPay's purchase API. Self-contained: to remove Apple Pay entirely,
// delete this file and its <ApplePayButton /> usage in page.jsx.
export default function ApplePayButton({ amount, onResult }) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // canMakePayments() throws (rather than returning false) on an insecure
    // origin, e.g. plain http://localhost, so treat that the same as "not
    // available" instead of letting it crash the page.
    try {
      setAvailable(Boolean(window.ApplePaySession && window.ApplePaySession.canMakePayments()));
    } catch {
      setAvailable(false);
    }
  }, []);

  function pay() {
    const reference = `order_${Date.now()}`;
    const session = new window.ApplePaySession(3, {
      countryCode: 'AU',
      currencyCode: 'AUD',
      supportedNetworks: ['visa', 'masterCard', 'amex'],
      merchantCapabilities: ['supports3DS'],
      total: { label: 'ArtsPay Example Store', amount },
    });

    // 1. Apple asks us to prove we're the registered merchant for this
    // validationURL, so forward it to our backend, which calls Fat Zebra's
    // Get Apple Pay Session endpoint and hands back an opaque session.
    session.onvalidatemerchant = (event) => {
      fetch('/api/apple-pay/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validationURL: event.validationURL }),
      })
        .then((res) => res.json())
        .then((merchantSession) => session.completeMerchantValidation(merchantSession))
        .catch(() => session.abort());
    };

    // 2. Once the customer authorizes with Face ID/Touch ID, Apple hands us
    // an encrypted payment token. Send it to our backend to charge it.
    session.onpaymentauthorized = (event) => {
      fetch('/api/apple-pay/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: event.payment.token, amount, reference }),
      })
        .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
        .then(({ ok, data }) => {
          const successful = ok && data.successful;
          session.completePayment(
            successful ? window.ApplePaySession.STATUS_SUCCESS : window.ApplePaySession.STATUS_FAILURE,
          );
          onResult(successful, data);
        });
    };

    session.begin();
  }

  if (!available) return null;
  return <button type="button" className="apple-pay-button" lang="en" onClick={pay} />;
}
