<script setup>
import { ref } from 'vue';

const amount = ref('5.00');
const checkoutStarted = ref(false);
const error = ref(null);
const result = ref(null);

// fz.validation.error/fz.sca.error don't carry a verification hash of their
// own (there's no transaction result yet to sign), so these are shown
// as-is rather than run through the response-verification step below.
function showSimpleResult(heading, data) {
  checkoutStarted.value = false;
  result.value = { heading, hashLine: null, data };
}

// fz.payment.success/fz.payment.error carry the full transaction result
// plus their own verification hash. The response is untrusted until the
// backend confirms it, the same way the plain Hosted Payment Page example
// verifies its response hash, since the shared secret needed to check it
// never reaches this page.
function verifyAndShowResult(data, successful) {
  fetch('/api/verify-payment-result', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then((res) => res.json())
    .then((verifyResult) => {
      checkoutStarted.value = false;
      result.value = {
        heading: successful ? 'Payment successful' : 'Payment not successful',
        hashLine: verifyResult.verified ? 'valid' : 'INVALID, do not trust this response',
        data,
      };
    });
}

async function startCheckout() {
  error.value = null;
  result.value = null;
  const res = await fetch(`/api/checkout-config?amount=${encodeURIComponent(amount.value)}`);
  const data = await res.json();
  if (!res.ok) {
    error.value = data.error || 'Failed to start checkout';
    return;
  }

  // fatzebra.js reads this out of localStorage itself; there's no
  // constructor option to pass it in directly.
  localStorage.setItem('fz-access-token', data.accessToken);
  checkoutStarted.value = true;

  // fz.on() fires with a real native CustomEvent, not a plain object: the
  // actual payload is nested under event.detail (confirmed against the
  // sandbox), not event.data directly as the SDK docs' own JSON examples
  // imply.
  const fz = new window.FatZebra({ username: data.username });
  fz.on('fz.validation.error', (event) => showSimpleResult('Validation error', event.detail));
  fz.on('fz.sca.error', (event) => showSimpleResult('3DS check failed', event.detail));
  fz.on('fz.payment.success', (event) => verifyAndShowResult(event.detail.data, true));
  fz.on('fz.payment.error', (event) => verifyAndShowResult(event.detail.data, false));

  fz.renderPaymentsPage({
    containerId: 'fz-paynow',
    customer: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'hello.world@example.com',
      address: '123 Australia Blvd.',
      city: 'Sydney',
      postcode: '2000',
      state: 'NSW',
      country: 'AU',
    },
    paymentIntent: {
      payment: { amount: data.amountCents, currency: data.currency, reference: data.reference },
      verification: data.verification,
    },
    options: { hideLogos: true, enableSca: true },
  });
}
</script>

<template>
  <h1>ArtsPay 3D Secure (fatzebra.js): Vue example</h1>
  <p>
    Renders ArtsPay's Hosted Payments Page through fatzebra.js with 3D Secure 2 enabled
    (<code>enableSca: true</code>). fatzebra.js tokenizes the card, runs the 3DS2 check, then
    submits the purchase itself: this page only reacts to its events, and the backend only
    ever mints a short-lived OAuth token and signs the request/response hashes; it never sees
    the card directly.
  </p>
  <p>
    Enter one of the <a href="https://artspay.com/docs/guides/3d-secure#testing">3DS2 test
    cards</a> from the guide to see a specific outcome (frictionless, step-up, decline).
  </p>

  <div v-if="!checkoutStarted && !result">
    <label>Amount (AUD) <input v-model="amount" /></label>
    <button type="button" @click="startCheckout">Pay with ArtsPay</button>
    <p v-if="error">{{ error }}</p>
  </div>

  <div
    id="fz-paynow"
    :style="{ display: checkoutStarted ? 'block' : 'none', width: '100%', height: '600px', border: 0 }"
  ></div>

  <div v-if="result">
    <h2>{{ result.heading }}</h2>
    <p v-if="result.hashLine"><strong>Response hash:</strong> {{ result.hashLine }}</p>
    <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
  </div>
</template>
