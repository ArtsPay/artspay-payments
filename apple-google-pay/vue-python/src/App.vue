<script setup>
import { ref } from 'vue';
import ApplePayButton from './ApplePayButton.vue';
import GooglePayButton from './GooglePayButton.vue';

const amount = ref('10.00');
const result = ref(null);

function handleResult(successful, data) {
  result.value = { successful, data };
}
</script>

<template>
  <h1>ArtsPay Apple Pay & Google Pay: Vue example</h1>
  <p>
    Both wallets charge directly through ArtsPay's purchase API instead of the Hosted Payment Page.
    Apple Pay only renders in Safari, over HTTPS, on a domain registered with Apple (see README).
    Google Pay needs a browser the Google Pay API supports and a Google account with a saved card.
  </p>
  <p>
    Sandbox responses are cent-based: the cents of the amount become the simulated response
    code, e.g. <code>10.05</code> declines with code <code>05</code>, <code>10.00</code>
    approves. See the <a href="https://artspay.com/docs/guides/apple-pay-web">Apple Pay</a> /
    <a href="https://artspay.com/docs/guides/google-pay-web">Google Pay</a> guides' Testing sections.
  </p>

  <label>Amount (AUD) <input v-model="amount" /></label><br /><br />

  <ApplePayButton :amount="amount" @result="handleResult" />
  <GooglePayButton :amount="amount" @result="handleResult" />

  <div v-if="result">
    <h2>{{ result.successful ? 'Payment successful' : 'Payment not successful' }}</h2>
    <pre>{{ JSON.stringify(result.data, null, 2) }}</pre>
  </div>
</template>
