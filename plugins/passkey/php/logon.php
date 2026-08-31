<?php

require_once __DIR__ . "/vendor/autoload.php";
require_once __DIR__ . "/class.passkeydata.settings.php";
require_once __DIR__ . "/class.passkeycredentialrepository.php";
// This page runs in a bare context (no index.php/grommunio.php bootstrap), so
// $GLOBALS["settings"] is never populated here. Load the plugin config so the
// server-authoritative PLUGIN_PASSKEY_* constants (notably PLUGIN_PASSKEY_RP_ID)
// are defined; getWebAuthnConfig() falls back to them when settings are absent.
require_once __DIR__ . "/../config.php";

use Webauthn\PublicKeyCredentialRequestOptions;
use Webauthn\PublicKeyCredential;
use Webauthn\AuthenticatorAssertionResponse;
use Webauthn\AuthenticatorAssertionResponseValidator;
use Webauthn\PublicKeyCredentialDescriptor;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AttestationStatement\NoneAttestationStatementSupport;
use Webauthn\Denormalizer\WebauthnSerializerFactory;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;

/**
 * PHP file to handle passkey authentication verification (assertion ceremony).
 *
 * This is the SECOND-FACTOR step: the user has already passed the password/MAPI
 * login (so there is a live authenticated session), and must now prove possession
 * of a registered passkey before the core gate
 * (WebAppAuthentication::enforceSecondFactor) lets any mailbox request through.
 *
 * Security properties enforced here:
 *  - The challenge is SERVER-minted and single-use. It is generated in the plugin
 *    hook (plugin.passkey.php), stored in the EncryptionStore, read once here, and
 *    deleted before verification. The client-supplied challenge is ignored.
 *  - The Relying Party ID / expected origin is SERVER-authoritative (configured
 *    PLUGIN_PASSKEY_RP_ID). If it is not configured we fail closed.
 *  - The user identity is taken from the stored credential, never from a
 *    client-supplied userHandle.
 */
require_once("../../../init.php");
require_once(BASE_PATH . "server/includes/bootstrap.php");
require_once(BASE_PATH . "server/includes/core/class.encryptionstore.php");

// Make sure the php session is started
WebAppSession::getInstance();

$encryptionStore = EncryptionStore::getInstance();

$assertionData = ($_POST && array_key_exists('assertion_data', $_POST)) ? $_POST['assertion_data'] : '';

// Read and CONSUME the single-use, server-generated challenge. It is deleted
// immediately - regardless of the verification outcome - so a failed or replayed
// attempt cannot reuse it. A fresh challenge is minted on the next index.php load.
$challenge = $encryptionStore->get('passkeyAssertionChallenge');
$encryptionStore->remove('passkeyAssertionChallenge');

$verification = false;

if ($assertionData && $challenge) {
    try {
        $assertion = json_decode($assertionData, true);

        if ($assertion && isset($assertion['id'])) {
            // Get user's stored credentials
            $credentials = $encryptionStore->get('passkeyCredentials');
            $credentialArray = $credentials ? json_decode($credentials, true) : [];

            // Find matching credential
            $matchingCredential = null;
            foreach ($credentialArray as $cred) {
                if ($cred['id'] === $assertion['id']) {
                    $matchingCredential = $cred;
                    break;
                }
            }

            if ($matchingCredential) {
                // Use proper WebAuthn validation
                $verification = validateWebAuthnAssertion($assertion, $matchingCredential, $challenge);
            }
        }
    } catch (\Throwable $e) {
        // Fail closed: any verification fault (including library TypeError/Error,
        // not just Exception) must leave $verification false, never 500.
        error_log("[passkey] Authentication error: " . $e->getMessage());
    }
}

if ($verification) {
    // Second factor satisfied. This authoritative flag is what the core gate
    // (WebAppAuthentication::secondFactorPending) consults on every entry point.
    WebAppAuthentication::setSecondFactorSatisfied(true);
    header('Location: ../../../index.php', true, 303);
} else {
    WebAppAuthentication::setSecondFactorSatisfied(false);
    header('Location: login.php', true, 303);
}

/**
 * Validate a WebAuthn assertion using the web-auth/webauthn-lib v5.x API.
 *
 * @param array  $assertionData   The assertion data from the client
 * @param array  $storedCredential The stored credential metadata (for allowCredentials)
 * @param string $challenge       The server-minted challenge (base64url), already consumed
 * @return bool True if validation succeeded
 */
function validateWebAuthnAssertion($assertionData, $storedCredential, $challenge)
{
    try {
        // Server-authoritative configuration. The RP-ID must be configured; we
        // NEVER derive it from the request host or the client's clientDataJSON.
        $config = PasskeyData::getWebAuthnConfig();
        if (empty($config['rp_id'])) {
            error_log("[passkey] Refusing assertion: PLUGIN_PASSKEY_RP_ID is not configured (fail closed).");
            return false;
        }

        // Create serializer (needed to deserialize the client PublicKeyCredential).
        $attestationStatementSupportManager = AttestationStatementSupportManager::create();
        $attestationStatementSupportManager->add(NoneAttestationStatementSupport::create());
        $factory = new WebauthnSerializerFactory($attestationStatementSupportManager);
        $serializer = $factory->create();

        $jsonData = json_encode($assertionData);

        // Load the public key credential from the client payload.
        $publicKeyCredential = $serializer->deserialize($jsonData, PublicKeyCredential::class, 'json');

        $authenticatorAssertionResponse = $publicKeyCredential->response;
        if (!$authenticatorAssertionResponse instanceof AuthenticatorAssertionResponse) {
            return false;
        }

        // Restrict the ceremony to the specific stored credential.
        $allowedCredentials = [
            PublicKeyCredentialDescriptor::create(
                'public-key',
                base64_decode(strtr($storedCredential['rawId'], '-_', '+/'))
            )
        ];

        // Decode the server-minted challenge (base64url) to raw bytes.
        $challengeBytes = base64_decode(strtr($challenge, '-_', '+/'));

        // Build the request options via the supported v5.x named-argument
        // constructor. NOTE: no ReflectionClass - the previous code poked private
        // readonly properties, which silently no-ops on library drift.
        $requestOptions = PublicKeyCredentialRequestOptions::create(
            $challengeBytes,
            rpId: $config['rp_id'],
            allowCredentials: $allowedCredentials,
            timeout: (int) $config['timeout']
        );

        // Look up the stored credential source (with its persisted counter and
        // its OWN userHandle). Identity comes from here, never from the client.
        $credentialManager = new PasskeyCredentialManager();
        $publicKeyCredentialSource = $credentialManager->findOneByCredentialId(
            $publicKeyCredential->rawId
        );

        if (!$publicKeyCredentialSource) {
            return false;
        }

        $csmFactory = new CeremonyStepManagerFactory();
        $assertionValidator = AuthenticatorAssertionResponseValidator::create(
            $csmFactory->requestCeremony()
        );

        // The 4th argument is the expected host/origin the library checks
        // clientDataJSON.origin against - we pass the SERVER-configured RP-ID.
        // The 5th argument (userHandle) is null: the library uses the handle from
        // the stored credential source. We do not trust or persist a client handle.
        $publicKeyCredentialSource = $assertionValidator->check(
            $publicKeyCredentialSource,
            $authenticatorAssertionResponse,
            $requestOptions,
            $config['rp_id'],
            null
        );

        // Persist the updated signature counter.
        $credentialManager->updateCredentialSource($publicKeyCredentialSource);

        return true;

    } catch (\Throwable $e) {
        // Fail closed on any fault, including a library Error/TypeError.
        error_log("[passkey] Authentication validation error: " . $e->getMessage());
        return false;
    }
}
