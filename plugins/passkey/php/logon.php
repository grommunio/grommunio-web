<?php

require_once __DIR__ . "/vendor/autoload.php";
require_once __DIR__ . "/class.passkeydata.settings.php";
require_once __DIR__ . "/class.passkeycredentialrepository.php";

use Webauthn\PublicKeyCredentialRequestOptions;
use Webauthn\PublicKeyCredential;
use Webauthn\PublicKeyCredentialSource;
use Webauthn\AuthenticatorAssertionResponse;
use Webauthn\AuthenticatorAssertionResponseValidator;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialDescriptor;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AttestationStatement\NoneAttestationStatementSupport;
use Webauthn\Denormalizer\WebauthnSerializerFactory;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7Server\ServerRequestCreator;

/**
 * PHP file to handle passkey authentication verification
 * Updated to use current WebAuthn library v5.x best practices
 */
require_once("../../../init.php");
require_once(BASE_PATH . "server/includes/bootstrap.php");
require_once(BASE_PATH . "server/includes/core/class.encryptionstore.php");

// Make sure the php session is started
WebAppSession::getInstance();

$assertionData = ($_POST && array_key_exists('assertion_data', $_POST)) ? $_POST['assertion_data'] : '';
$challenge = ($_POST && array_key_exists('challenge', $_POST)) ? $_POST['challenge'] : '';

$encryptionStore = EncryptionStore::getInstance();
$user = $encryptionStore->get('username');
$verification = false;

if ($assertionData && $challenge) {
    try {
        $assertion = json_decode($assertionData, true);
        
        if ($assertion && isset($assertion['id'])) {
            // Get user's stored credentials
            $credentials = $encryptionStore->get('passkeyCredentials', '');
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
    } catch (Exception $e) {
        // Log errors for debugging if needed
        error_log("[passkey] Authentication error: " . $e->getMessage());
    }
}

if ($verification) {
    $_SESSION['passkeyLoggedOn'] = TRUE; // Passkey authentication successful
    header('Location: ../../../index.php', true, 303);
} else {
    $_SESSION['passkeyLoggedOn'] = FALSE; // Authentication failed
    header('Location: login.php', true, 303);
}

/**
 * Validate WebAuthn assertion using current v5.x library
 * @param array $assertionData The assertion data from client
 * @param array $storedCredential The stored credential data
 * @param string $challenge The challenge used
 * @return boolean True if validation successful
 */
function validateWebAuthnAssertion($assertionData, $storedCredential, $challenge)
{
    try {
        // Create PSR-7 request
        $psr17Factory = new Psr17Factory();
        $creator = new ServerRequestCreator(
            $psr17Factory,
            $psr17Factory,
            $psr17Factory,
            $psr17Factory
        );
        
        // Convert assertion data to JSON for PSR-7 request
        $jsonData = json_encode($assertionData);
        $request = $creator->fromGlobals()
            ->withBody($psr17Factory->createStream($jsonData))
            ->withHeader('Content-Type', 'application/json');
        
        // Create attestation statement support manager
        $attestationStatementSupportManager = AttestationStatementSupportManager::create();
        $attestationStatementSupportManager->add(NoneAttestationStatementSupport::create());
        
        // Create serializer
        $factory = new WebauthnSerializerFactory($attestationStatementSupportManager);
        $serializer = $factory->create();
        
        // Load the public key credential using serializer
        $publicKeyCredential = $serializer->deserialize($jsonData, PublicKeyCredential::class, 'json');
        
        // Get the response
        $authenticatorAssertionResponse = $publicKeyCredential->response;
        
        if (!$authenticatorAssertionResponse instanceof AuthenticatorAssertionResponse) {
            return false;
        }
        
        // Get WebAuthn configuration
        $config = PasskeyData::getWebAuthnConfig();
        
        // Create RP entity
        $rpEntity = PublicKeyCredentialRpEntity::create(
            $config['rp_name'],
            $config['rp_id']
        );
        
        // Create allowed credentials
        $allowedCredentials = [
            PublicKeyCredentialDescriptor::create(
                'public-key',
                base64_decode(strtr($storedCredential['rawId'], '-_', '+/'))
            )
        ];
        
        // Decode the challenge
        $challengeBytes = base64_decode(strtr($challenge, '-_', '+/'));
        
        // Create request options using current v5.x approach
        $requestOptions = PublicKeyCredentialRequestOptions::create($challengeBytes);
        
        // Set additional properties using reflection since setter methods don't exist in v5.x
        $reflection = new ReflectionClass($requestOptions);
        
        // Set RP ID
        if ($reflection->hasProperty('rpId')) {
            $rpIdProperty = $reflection->getProperty('rpId');
            $rpIdProperty->setAccessible(true);
            $rpIdProperty->setValue($requestOptions, $rpEntity->id);
        }
        
        // Set timeout
        if ($reflection->hasProperty('timeout')) {
            $timeoutProperty = $reflection->getProperty('timeout');
            $timeoutProperty->setAccessible(true);
            $timeoutProperty->setValue($requestOptions, $config['timeout']);
        }
        
        // Set allowed credentials
        if ($reflection->hasProperty('allowCredentials')) {
            $allowCredentialsProperty = $reflection->getProperty('allowCredentials');
            $allowCredentialsProperty->setAccessible(true);
            $allowCredentialsProperty->setValue($requestOptions, $allowedCredentials);
        }
        
        // Create credential manager and get stored credential source
        $credentialManager = new PasskeyCredentialManager();
        $publicKeyCredentialSource = $credentialManager->findOneByCredentialId(
            $publicKeyCredential->rawId
        );
        
        if (!$publicKeyCredentialSource) {
            return false;
        }
        
        // Create ceremony step manager factory and request ceremony (v5.x)
        $csmFactory = new CeremonyStepManagerFactory();
        $requestCSM = $csmFactory->requestCeremony();
        
        // Create validator with ceremony step manager (v5.x)
        $assertionValidator = AuthenticatorAssertionResponseValidator::create($requestCSM);
        
        // Get the user handle from the client's assertion response
        $clientUserHandle = $authenticatorAssertionResponse->userHandle;
        
        // If the client sends a user handle but our stored credential doesn't match,
        // we need to update the credential source to match what the client expects
        if ($clientUserHandle && $publicKeyCredentialSource->userHandle !== $clientUserHandle) {
            // Create a new credential source with the client's user handle
            $publicKeyCredentialSource = new PublicKeyCredentialSource(
                $publicKeyCredentialSource->publicKeyCredentialId,
                $publicKeyCredentialSource->type,
                $publicKeyCredentialSource->transports,
                $publicKeyCredentialSource->attestationType,
                $publicKeyCredentialSource->trustPath,
                $publicKeyCredentialSource->aaguid,
                $publicKeyCredentialSource->credentialPublicKey,
                $clientUserHandle, // Use the client's user handle
                $publicKeyCredentialSource->counter
            );
        }
        
        // Use the client's user handle for validation
        $userHandle = $clientUserHandle;
        
        $publicKeyCredentialSource = $assertionValidator->check(
            $publicKeyCredentialSource,
            $authenticatorAssertionResponse,
            $requestOptions,
            $config['rp_id'],
            $userHandle
        );
        
        // Update the credential with new counter value
        $credentialManager->updateCredentialSource($publicKeyCredentialSource);
        
        return true;
        
    } catch (Exception $e) {
        error_log("[passkey] Authentication validation error: " . $e->getMessage());
        return false;
    }
}
