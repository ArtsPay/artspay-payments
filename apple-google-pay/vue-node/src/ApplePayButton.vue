<script setup>
// Apple Pay (Web): native ApplePaySession flow, charged directly through
// ArtsPay's purchase API. Self-contained: to remove Apple Pay entirely,
// delete this file and its <ApplePayButton /> usage in App.vue.
import { onMounted, ref } from 'vue';

const props = defineProps({ amount: { type: String, required: true } });
const emit = defineEmits(['result']);

const available = ref(false);

onMounted(() => {
  // canMakePayments() throws (rather than returning false) on an insecure
  // origin, e.g. plain http://localhost, so treat that the same as "not
  // available" instead of letting it crash the page.
  try {
    available.value = Boolean(window.ApplePaySession && window.ApplePaySession.canMakePayments());
  } catch {
    available.value = false;
  }
});

function pay() {
  const reference = `order_${Date.now()}`;
  const session = new window.ApplePaySession(3, {
    countryCode: 'AU',
    currencyCode: 'AUD',
    supportedNetworks: ['visa', 'masterCard', 'amex'],
    merchantCapabilities: ['supports3DS'],
    total: { label: 'ArtsPay Example Store', amount: props.amount },
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
      body: JSON.stringify({ token: event.payment.token, amount: props.amount, reference }),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        const successful = ok && data.successful;
        session.completePayment(
          successful ? window.ApplePaySession.STATUS_SUCCESS : window.ApplePaySession.STATUS_FAILURE,
        );
        emit('result', successful, data);
      });
  };

  session.begin();
}
</script>

<template>
  <button v-if="available" type="button" class="apple-pay-button" lang="en" @click="pay"></button>
</template>
