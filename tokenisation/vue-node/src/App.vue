<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

// Must match the environment used to build the checkout URL (sandbox shown
// here; swap to https://paynow.pmnts.io for live).
const PAYMENT_HOST = 'https://paynow.pmnts-sandbox.io';

const checkoutUrl = ref(null);
const saveResult = ref(null);
const saveError = ref(null);

const token = ref('');
const chargeAmount = ref('10.00');
const recurring = ref(false);
const chargeResult = ref(null);

async function startSaveCard() {
  saveError.value = null;
  const res = await fetch('/api/checkout-url');
  const data = await res.json();
  if (!res.ok) {
    saveError.value = data.error || 'Failed to start';
    return;
  }
  checkoutUrl.value = data.url;
}

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

  checkoutUrl.value = null;
  saveResult.value = result;
  if (result.verified && result.token) {
    token.value = result.token;
  }
}

onMounted(() => window.addEventListener('message', handleMessage));
onUnmounted(() => window.removeEventListener('message', handleMessage));

async function chargeToken() {
  const res = await fetch('/api/charge-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cardToken: token.value,
      amount: chargeAmount.value,
      reference: `order_${Date.now()}`,
      recurring: recurring.value,
    }),
  });
  const data = await res.json();
  chargeResult.value = { successful: res.ok && data.successful, data };
}
</script>

<template>
  <h1>ArtsPay Tokenisation: Vue example</h1>
  <p>
    Two independent flows: saving a card via the Hosted Payment Page's tokenize-only mode
    (no charge, no raw card number touches this server), and charging a previously saved
    token directly through ArtsPay's purchase API, which is what a server does on its own
    for a renewal.
  </p>

  <h2>1. Save a card</h2>
  <div v-if="!checkoutUrl">
    <button type="button" @click="startSaveCard">Save a card</button>
    <p v-if="saveError">{{ saveError }}</p>
  </div>
  <iframe
    v-if="checkoutUrl"
    title="ArtsPay Save Card"
    :src="checkoutUrl"
    style="width: 100%; height: 600px; border: 0;"
  />
  <div v-if="saveResult">
    <h3>{{ saveResult.verified ? 'Success' : 'Not successful' }}</h3>
    <pre>{{ JSON.stringify(saveResult, null, 2) }}</pre>
  </div>

  <h2>2. Charge a saved token</h2>
  <p>Paste in a token from step 1 (or one you already have) and charge it directly.</p>
  <label>Token <input v-model="token" placeholder="e.g. fke8jmra" /></label><br /><br />
  <label>Amount (AUD) <input v-model="chargeAmount" /></label><br /><br />
  <label><input v-model="recurring" type="checkbox" /> This is a subsequent recurring charge</label><br /><br />
  <button type="button" @click="chargeToken">Charge token</button>
  <div v-if="chargeResult">
    <h3>{{ chargeResult.successful ? 'Success' : 'Not successful' }}</h3>
    <pre>{{ JSON.stringify(chargeResult.data, null, 2) }}</pre>
  </div>
</template>
