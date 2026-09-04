// Google Pay: Google's own PaymentsClient JS, charged directly through
// ArtsPay's purchase API. Self-contained: it loads Google's SDK itself, so
// removing Google Pay is just: delete this file, its <script> tag in
// index.html, the #google-pay-button element, and the /api/google-pay/*
// routes in server.js.

var GooglePaymentsClient = null;

var GoogleCardPaymentMethod = {
  type: 'CARD',
  parameters: {
    allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
    allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX', 'JCB'],
  },
};

function GoogleLoadPayJsSdk() {
  return new Promise(function (resolve, reject) {
    var script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function GoogleInit() {
  GoogleLoadPayJsSdk().then(function () {
    // Sandbox test cards need ENVIRONMENT_TEST; swap to 'PRODUCTION' for a
    // live deployment. See the Google Pay guide's Testing section.
    GooglePaymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });

    var isReadyToPayRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: [GoogleCardPaymentMethod],
    };

    GooglePaymentsClient.isReadyToPay(isReadyToPayRequest).then(function (response) {
      if (!response.result) return;
      document.getElementById('google-pay-button').style.display = 'inline-block';
      document.getElementById('google-pay-button').appendChild(
        GooglePaymentsClient.createButton({ onClick: GoogleStartPayment })
      );
    });
  });
}

function GoogleStartPayment() {
  var amount = getAmount();
  var reference = makeReference();

  fetch('/api/google-pay/config')
    .then(function (res) { return res.json(); })
    .then(function (config) {
      var paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [Object.assign({}, GoogleCardPaymentMethod, {
          // Points Google's tokenization at ArtsPay. See the Google Pay guide.
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: { gateway: 'fatzebra', gatewayMerchantId: config.gatewayMerchantId },
          },
        })],
        merchantInfo: { merchantName: 'ArtsPay Example Store' },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount,
          currencyCode: 'AUD',
          countryCode: 'AU',
        },
      };
      return GooglePaymentsClient.loadPaymentData(paymentDataRequest);
    })
    .then(function (paymentData) {
      var token = paymentData.paymentMethodData.tokenizationData.token;
      return fetch('/api/google-pay/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token, amount: amount, reference: reference }),
      });
    })
    .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
    .then(function (result) { showResult(result.ok && result.data.successful, result.data); });
}

GoogleInit();
