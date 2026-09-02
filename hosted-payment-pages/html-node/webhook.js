// Very basic ArtsPay webhook receiver. Optional: only wire this up if your
// integration actually needs webhooks (e.g. async notification of a
// purchase result). Delete this file and its require/app.use in server.js
// if you don't.
//
// ArtsPay's current docs don't publish a webhook signing secret, so there's
// no signature to verify here (unlike, say, Stripe's webhooks). Events look
// like { event: "purchase:success", payload: {...} }, see the Webhooks
// guide for the full event list. The route path this is mounted at (see
// server.js) is just a suggestion, adjust it to whatever your own webhook
// URL should be.
function handleWebhook(req, res) {
  const { event, payload } = req.body ?? {};
  console.log(`Received webhook: ${event}`, payload);

  // Webhooks can be retried, so handle the same event id more than once
  // without double-processing (e.g. check your own order status first).

  res.sendStatus(200);
}

module.exports = { handleWebhook };
