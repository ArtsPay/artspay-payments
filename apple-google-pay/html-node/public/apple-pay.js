// Apple Pay (Web): native ApplePaySession flow, charged directly through
// ArtsPay's purchase API. Self-contained: to remove Apple Pay entirely,
// delete this file, its <script> tag in index.html, the #apple-pay-button
// element, and the /.well-known/... + /api/apple-pay/* routes in server.js.

if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
  document.getElementById('apple-pay-button').style.display = 'inline-block';
}

document.getElementById('apple-pay-button').addEventListener('click', function () {
  var amount = getAmount();
  var reference = makeReference();

  var session = new ApplePaySession(3, {
    countryCode: 'AU',
    currencyCode: 'AUD',
    supportedNetworks: ['visa', 'masterCard', 'amex'],
    merchantCapabilities: ['supports3DS'],
    total: { label: 'ArtsPay Example Store', amount: amount },
  });

  // 1. Apple asks us to prove we're the registered merchant for this
  // validationURL, so forward it to our backend, which calls Fat Zebra's
  // Get Apple Pay Session endpoint and hands back an opaque session.
  session.onvalidatemerchant = function (event) {
    fetch('/api/apple-pay/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validationURL: event.validationURL }),
    })
      .then(function (res) { return res.json(); })
      .then(function (merchantSession) { session.completeMerchantValidation(merchantSession); })
      .catch(function () { session.abort(); });
  };

  // 2. Once the customer authorizes with Face ID/Touch ID, Apple hands us
  // an encrypted payment token. Send it to our backend to charge it.
  session.onpaymentauthorized = function (event) {
    fetch('/api/apple-pay/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: event.payment.token, amount: amount, reference: reference }),
    })
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        var successful = result.ok && result.data.successful;
        session.completePayment(successful ? ApplePaySession.STATUS_SUCCESS : ApplePaySession.STATUS_FAILURE);
        showResult(successful, result.data);
      });
  };

  session.begin();
});
