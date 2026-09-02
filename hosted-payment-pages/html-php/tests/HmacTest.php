<?php

use PHPUnit\Framework\TestCase;

require __DIR__ . '/../hmac.php';

// Fat Zebra's docs give the field order and an example string, but not a
// published (secret, hash) test vector, so these tests check the string
// construction against an independent HMAC-MD5 call rather than a fixed
// expected hash.

final class HmacTest extends TestCase
{
    public function testBuildVerificationHashJoinsReferenceAmountCurrency(): void
    {
        $secret = 'test-secret';
        $expected = hash_hmac('md5', 'INV1121:100.25:AUD', $secret);
        $actual = build_verification_hash($secret, 'INV1121', '100.25', 'AUD');
        $this->assertSame($expected, $actual);
    }

    public function testBuildVerificationHashAppendsHideCardHolder(): void
    {
        $secret = 'test-secret';
        $expected = hash_hmac('md5', 'INV1121:100.25:AUD:true', $secret);
        $actual = build_verification_hash($secret, 'INV1121', '100.25', 'AUD', true);
        $this->assertSame($expected, $actual);
    }

    public function testBuildVerificationHashAppendsReturnPathAfterHideCardHolder(): void
    {
        $secret = 'test-secret';
        $expected = hash_hmac('md5', 'INV1121:100.25:AUD:true:https://example.com/cb', $secret);
        $actual = build_verification_hash($secret, 'INV1121', '100.25', 'AUD', true, 'https://example.com/cb');
        $this->assertSame($expected, $actual);
    }

    public function testBuildVerificationHashOmitsReturnPathWhenBlank(): void
    {
        $secret = 'test-secret';
        $expected = hash_hmac('md5', 'INV1121:100.25:AUD', $secret);
        $actual = build_verification_hash($secret, 'INV1121', '100.25', 'AUD', false, '');
        $this->assertSame($expected, $actual);
    }

    public function testVerifyPurchaseResponseAcceptsCorrectlySignedResponse(): void
    {
        $secret = 'test-secret';
        $verification = hash_hmac('md5', '1:true:10025:AUD:001-P-ABCDG1123:abcd1234', $secret);
        $this->assertTrue(verify_purchase_response($secret, '1', 'true', '10025', 'AUD', '001-P-ABCDG1123', 'abcd1234', $verification));
    }

    public function testVerifyPurchaseResponseRejectsTamperedField(): void
    {
        $secret = 'test-secret';
        $verification = hash_hmac('md5', '1:true:10025:AUD:001-P-ABCDG1123:abcd1234', $secret);
        $this->assertFalse(verify_purchase_response($secret, '1', 'true', '99999', 'AUD', '001-P-ABCDG1123', 'abcd1234', $verification));
    }

    public function testVerifyPurchaseResponseRejectsWrongSecret(): void
    {
        $verification = hash_hmac('md5', '1:true:10025:AUD:001-P-ABCDG1123:abcd1234', 'wrong-secret');
        $this->assertFalse(verify_purchase_response('test-secret', '1', 'true', '10025', 'AUD', '001-P-ABCDG1123', 'abcd1234', $verification));
    }

    public function testVerifyTokenizeResponse(): void
    {
        $secret = 'test-secret';
        $verification = hash_hmac('md5', '1:abcd1234', $secret);
        $this->assertTrue(verify_tokenize_response($secret, '1', 'abcd1234', $verification));
    }
}
