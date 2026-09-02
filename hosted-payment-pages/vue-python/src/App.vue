<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

// Must match the environment used to build the checkout URL (sandbox shown
// here; swap to https://paynow.pmnts.io for live).
const PAYMENT_HOST = 'https://paynow.pmnts-sandbox.io';

const amount = ref('10.25');
const checkoutUrl = ref(null);
const result = ref(null);
const error = ref(null);

async function startCheckout() {
  error.value = null;
  const res = await fetch(`/api/checkout-url?amount=${encodeURIComponent(amount.value)}`);
  const data = await res.json();
  if (!res.ok) {
    error.value = data.error || 'Failed to start checkout';
    return;
  }
  checkoutUrl.value = data.url;
}

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
    checkoutUrl.value = null;
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

  checkoutUrl.value = null;
  result.value = { purchase, verified, isSuccess: String(purchase.r) === '1' };
}

onMounted(() => window.addEventListener('message', handleMessage));
onUnmounted(() => window.removeEventListener('message', handleMessage));
</script>

<template>
  <h1>ArtsPay Hosted Payment Page: Vue example</h1>
  <p>
    Uses the iframe + postMessage integration method: no page navigation, the result arrives as a
    browser event that this page sends to the backend for verification before trusting it.
  </p>

  <div v-if="!checkoutUrl && !result">
    <label>Amount (AUD) <input v-model="amount" /></label>
    <button type="button" @click="startCheckout">Pay with ArtsPay</button>
    <p v-if="error">{{ error }}</p>
  </div>

  <iframe
    v-if="checkoutUrl"
    title="ArtsPay Checkout"
    :src="checkoutUrl"
    style="width: 100%; height: 600px; border: 0;"
  />

  <div v-if="result">
    <h2>{{ result.isSuccess ? 'Payment successful' : 'Payment not successful' }}</h2>
    <p><strong>Response hash:</strong> {{ result.verified ? 'valid' : 'INVALID, do not trust this response' }}</p>
    <pre>{{ JSON.stringify(result.purchase, null, 2) }}</pre>
  </div>
</template>
