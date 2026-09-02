<?php

require __DIR__ . '/hmac.php';
require __DIR__ . '/webhook.php';

// Replace these with your ArtsPay sandbox credentials. You can also set
// them as FZ_USERNAME / FZ_SHARED_SECRET environment variables instead of
// editing this file, if you prefer.
$FZ_USERNAME = getenv('FZ_USERNAME') ?: '';
$FZ_SHARED_SECRET = getenv('FZ_SHARED_SECRET') ?: '';

const HPP_BASE_URL = 'https://paynow.pmnts-sandbox.io/v3';
const AMOUNT_PATTERN = '/^\d+(\.\d{1,2})?$/';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Returns a Hosted Payment Page URL for embedding in an iframe. Uses
// iframe=true&postmessage=true, not a redirect: the hosted page posts the
// result back to the parent window instead of navigating away.
if ($path === '/api/checkout-url' && $method === 'GET') {
    header('Content-Type: application/json');

    if (!$FZ_USERNAME || !$FZ_SHARED_SECRET) {
        http_response_code(500);
        echo json_encode(['error' => 'Set FZ_USERNAME and FZ_SHARED_SECRET in server.php first.'], JSON_UNESCAPED_SLASHES);
        return true;
    }

    $amount = $_GET['amount'] ?? '';
    if (!preg_match(AMOUNT_PATTERN, $amount)) {
        $amount = '10.25';
    }
    $reference = 'order_' . (int) round(microtime(true) * 1000);
    $currency = 'AUD';

    $hash = build_verification_hash($FZ_SHARED_SECRET, $reference, $amount, $currency);
    $url = HPP_BASE_URL . "/$FZ_USERNAME/$reference/$currency/$amount/$hash?iframe=true&postmessage=true";

    echo json_encode(['url' => $url], JSON_UNESCAPED_SLASHES);
    return true;
}

// The postMessage payload is untrusted until this endpoint verifies it: the
// shared secret needed to check it never reaches the browser.
if ($path === '/api/verify' && $method === 'POST') {
    header('Content-Type: application/json');

    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $verified = verify_purchase_response(
        $FZ_SHARED_SECRET,
        $body['r'] ?? null,
        $body['successful'] ?? null,
        $body['amount'] ?? null,
        $body['currency'] ?? null,
        $body['id'] ?? null,
        $body['token'] ?? null,
        $body['v'] ?? null,
    );

    echo json_encode(['verified' => $verified], JSON_UNESCAPED_SLASHES);
    return true;
}

// Optional: see webhook.php. Adjust the path to whatever your own webhook
// URL should be, or remove this block entirely if you don't need webhooks.
if ($path === '/webhooks' && $method === 'POST') {
    handle_webhook();
    return true;
}

// Anything else falls through to the built-in server's static file handling
// (serving from the -t public document root, e.g. public/index.html for /).
return false;
