<?php

// Very basic ArtsPay webhook receiver. Optional: only wire this up if your
// integration actually needs webhooks (e.g. async notification of a
// purchase result). Delete this file and its require/handle_webhook() call
// in router.php if you don't.
//
// ArtsPay's current docs don't publish a webhook signing secret, so there's
// no signature to verify here (unlike, say, Stripe's webhooks). Events look
// like {"event": "purchase:success", "payload": {...}}, see the Webhooks
// guide for the full event list. The route path this is registered at (see
// router.php) is just a suggestion, adjust it to whatever your own webhook
// URL should be.
function handle_webhook(): void
{
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    error_log('Received webhook: ' . ($body['event'] ?? 'unknown') . ' ' . json_encode($body['payload'] ?? null));

    // Webhooks can be retried, so handle the same event id more than once
    // without double-processing (e.g. check your own order status first).

    http_response_code(200);
}
