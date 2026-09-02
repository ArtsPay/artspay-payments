<?php

function hmac_md5_hex(string $sharedSecret, string $message): string
{
    return hash_hmac('md5', $message, $sharedSecret);
}

/**
 * Builds the verification hash for a V3 Hosted Payment Page request URL.
 * Field order matters: reference, amount, currency, then hide_card_holder
 * and return_path if present. See the Hosted Payment Pages guide at
 * artspay.com/docs/guides for the full signing scheme.
 */
function build_verification_hash(
    string $sharedSecret,
    string $reference,
    string $amount,
    string $currency,
    bool $hideCardHolder = false,
    ?string $returnPath = null
): string {
    $parts = [$reference, $amount, $currency];
    if ($hideCardHolder) {
        $parts[] = 'true';
    }
    if ($returnPath) {
        $parts[] = $returnPath;
    }
    return hmac_md5_hex($sharedSecret, implode(':', $parts));
}

/** Verifies a purchase response's `v` param against response_code:successful:amount:currency:id:token. */
function verify_purchase_response(
    string $sharedSecret,
    $responseCode,
    $successful,
    $amount,
    $currency,
    $id,
    $token,
    $verification
): bool {
    $expected = hmac_md5_hex($sharedSecret, "$responseCode:$successful:$amount:$currency:$id:$token");
    return hash_equals($expected, (string) $verification);
}

/** Verifies a tokenize-only response's `v` param against response_code:token. */
function verify_tokenize_response(string $sharedSecret, $responseCode, $token, $verification): bool
{
    $expected = hmac_md5_hex($sharedSecret, "$responseCode:$token");
    return hash_equals($expected, (string) $verification);
}
