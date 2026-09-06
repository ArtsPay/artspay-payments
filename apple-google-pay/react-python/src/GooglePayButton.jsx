import { useEffect, useRef } from 'react';

let sdkPromise = null;
function loadGooglePayScript() {
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://pay.google.com/gp/p/js/pay.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

const CARD_PAYMENT_METHOD = {
  type: 'CARD',
  parameters: {
    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
    allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'JCB'],
  },
};

// Google Pay: Google's own PaymentsClient JS, charged directly through
// ArtsPay's purchase API. Self-contained: to remove Google Pay entirely,
// delete this file and its <GooglePayButton /> usage in App.jsx.
export default function GooglePayButton({ amount, onResult }) {
  const containerRef = useRef(null);
  const amountRef = useRef(amount);
  amountRef.current = amount;

  useEffect(() => {
    let client = null;

    async function startPayment() {
      const reference = `order_${Date.now()}`;
      const configRes = await fetch('/api/google-pay/config');
      const config = await configRes.json();
      if (!configRes.ok) {
        onResult(false, config);
        return;
      }

      const paymentData = await client.loadPaymentData({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [{
          ...CARD_PAYMENT_METHOD,
          // Points Google's tokenization at ArtsPay. See the Google Pay guide.
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: { gateway: 'fatzebra', gatewayMerchantId: config.gatewayMerchantId },
          },
        }],
        merchantInfo: { merchantName: 'ArtsPay Example Store' },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amountRef.current,
          currencyCode: 'AUD',
          countryCode: 'AU',
        },
      });

      const token = paymentData.paymentMethodData.tokenizationData.token;
      const chargeRes = await fetch('/api/google-pay/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, amount: amountRef.current, reference }),
      });
      const data = await chargeRes.json();
      onResult(chargeRes.ok && data.successful, data);
    }

    // Sandbox test cards need ENVIRONMENT_TEST; swap to 'PRODUCTION' for a
    // live deployment. See the Google Pay guide's Testing section.
    loadGooglePayScript().then(() => {
      client = new window.google.payments.api.PaymentsClient({ environment: 'TEST' });

      client.isReadyToPay({
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [CARD_PAYMENT_METHOD],
      }).then((response) => {
        if (!response.result || !containerRef.current) return;
        containerRef.current.replaceChildren(client.createButton({ onClick: startPayment }));
      });
    });
  }, []);

  return <div className="google-pay-button" ref={containerRef} />;
}
