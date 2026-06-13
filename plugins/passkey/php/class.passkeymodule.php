<?php

require_once __DIR__ . "/vendor/autoload.php";
require_once __DIR__ . "/class.passkeydata.settings.php";
require_once __DIR__ . "/class.passkeycredentialrepository.php";

use Webauthn\PublicKeyCredentialCreationOptions;
use Webauthn\PublicKeyCredentialRequestOptions;
use Webauthn\PublicKeyCredentialSource;
use Webauthn\PublicKeyCredential;
use Webauthn\AuthenticatorAttestationResponse;
use Webauthn\AuthenticatorAssertionResponse;
use Webauthn\AuthenticatorAttestationResponseValidator;
use Webauthn\AuthenticatorAssertionResponseValidator;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialUserEntity;
use Webauthn\PublicKeyCredentialParameters;
use Webauthn\PublicKeyCredentialDescriptor;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AttestationStatement\NoneAttestationStatementSupport;
use Webauthn\AttestationStatement\PackedAttestationStatementSupport;
use Webauthn\Denormalizer\WebauthnSerializerFactory;
use Cose\Algorithm\Manager;
use Cose\Algorithm\Signature\ECDSA;
use Cose\Algorithm\Signature\RSA;
use Nyholm\Psr7\Factory\Psr17Factory;
use Nyholm\Psr7Server\ServerRequestCreator;

/**
 * Passkey Module for handling WebAuthn operations
 * Updated to use current WebAuthn library v5.x best practices
 *
 * @class PasskeyModule
 * @extends Module
 */
class PasskeyModule extends Module
{
    private $credentialManager;
    private $csmFactory;
    private $attestationValidator;
    private $assertionValidator;

    /**
     * @constructor
     * @param int $id unique id.
     * @param array $data list of all actions.
     */
    public function __construct($id, $data)
    {
        parent::__construct($id, $data);
        
        // Initialize WebAuthn components using current v5.x patterns
        $this->credentialManager = new PasskeyCredentialManager();
        $this->csmFactory = new CeremonyStepManagerFactory();
        
        // Configure attestation statement support manager
        $attestationStatementSupportManager = AttestationStatementSupportManager::create();
        $attestationStatementSupportManager->add(NoneAttestationStatementSupport::create());
        
        // Create COSE Algorithm Manager for PackedAttestationStatementSupport
        $coseAlgorithmManager = Manager::create();
        $coseAlgorithmManager->add(ECDSA\ES256::create());
        $coseAlgorithmManager->add(RSA\RS256::create());
        
        $attestationStatementSupportManager->add(PackedAttestationStatementSupport::create($coseAlgorithmManager));
        
        // Set the attestation statement support manager in the factory
        $this->csmFactory->setAttestationStatementSupportManager($attestationStatementSupportManager);
        
        // Create validators using the configured factory
        $this->attestationValidator = AuthenticatorAttestationResponseValidator::create(
            $this->csmFactory->creationCeremony()
        );
        
        $this->assertionValidator = AuthenticatorAssertionResponseValidator::create(
            $this->csmFactory->requestCeremony()
        );
    }

    /**
     * Executes all the actions in the $data variable.
     * @return boolean true on success or false on failure.
     */
    public function execute()
    {
        $result = false;

        foreach ($this->data as $actionType => $action) {
            if (isset($action["passkey_action"])) {
                try {
                    switch ($action["passkey_action"]) {
                        case "register":
                            $result = $this->registerPasskey($action);
                            break;
                        case "authenticate":
                            $result = $this->authenticatePasskey($action);
                            break;
                        case "delete":
                            $result = $this->deletePasskey($action);
                            break;
                        case "list":
                            $result = $this->listPasskeys($action);
                            break;
                        case "activate":
                            $result = $this->activate();
                            break;
                        case "isactivated":
                            $result = $this->isActivated();
                            break;
                        default:
                            $this->sendFeedback(false, array(
                                'type' => ERROR_GENERAL,
                                'info' => array(
                                    'message' => dgettext('plugin_passkey', 'Unknown action')
                                )
                            ));
                    }
                } catch (Exception $e) {
                    $this->sendFeedback(false, array(
                        'type' => ERROR_GENERAL,
                        'info' => array(
                            'message' => dgettext('plugin_passkey', 'An error occurred: ') . $e->getMessage()
                        )
                    ));
                }
            } else {
                if (isset($actionType)) {
                    try {
                        switch ($actionType) {
                            case "activate":
                                $result = $this->activate();
                                break;
                            case "isactivated":
                                $result = $this->isActivated();
                                break;
                            default:
                                $this->sendFeedback(false, array(
                                    'type' => ERROR_GENERAL,
                                    'info' => array(
                                        'message' => dgettext('plugin_passkey', 'Unknown action')
                                    )
                                ));
                        }
                    } catch (Exception $e) {
                        $this->sendFeedback(false, array(
                            'type' => ERROR_GENERAL,
                            'info' => array(
                                'message' => dgettext('plugin_passkey', 'An error occurred: ') . $e->getMessage()
                            )
                        ));
                    }
                }
            }
        }

        return $result;
    }

    /**
     * Register a new passkey
     * @param array $action Action data
     * @return boolean Success status
     */
    private function registerPasskey($action)
    {
        if (!isset($action['credential_data']) || !isset($action['name'])) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Missing credential data or name')
                )
            ));
            return false;
        }

        $credentialData = json_decode($action['credential_data'], true);
        $name = $action['name'];

        if (!$credentialData) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Invalid credential data')
                )
            ));
            return false;
        }

        // Validate the credential data structure
        if (!isset($credentialData['id']) || !isset($credentialData['rawId']) || 
            !isset($credentialData['response']['attestationObject']) || 
            !isset($credentialData['response']['clientDataJSON'])) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Invalid credential structure')
                )
            ));
            return false;
        }

        // Validate the attestation response using WebAuthn library
        $publicKeyCredentialSource = $this->validateAttestationResponse($credentialData);
        
        if (!$publicKeyCredentialSource) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Invalid attestation response')
                )
            ));
            return false;
        }

        // Create credential record with validated data
        $credential = array(
            'id' => $credentialData['id'],
            'name' => $name,
            'rawId' => $credentialData['rawId'],
            'publicKey' => base64_encode($publicKeyCredentialSource->credentialPublicKey),
            'signCount' => $publicKeyCredentialSource->counter,
            'userHandle' => $publicKeyCredentialSource->userHandle,
            'created' => time()
        );

        // Add credential to user's passkeys
        PasskeyData::addCredential($credential);

        $this->sendFeedback(true, array(
            'success' => true,
            'message' => dgettext('plugin_passkey', 'Passkey registered successfully')
        ));

        return true;
    }

    /**
     * Authenticate with passkey
     * @param array $action Action data
     * @return boolean Success status
     */
    private function authenticatePasskey($action)
    {
        if (!isset($action['assertion_data'])) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Missing assertion data')
                )
            ));
            return false;
        }

        $assertionData = json_decode($action['assertion_data'], true);

        if (!$assertionData) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Invalid assertion data')
                )
            ));
            return false;
        }

        // Validate assertion data structure
        if (!isset($assertionData['id']) || !isset($assertionData['response']['signature']) || 
            !isset($assertionData['response']['authenticatorData']) || 
            !isset($assertionData['response']['clientDataJSON'])) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Invalid assertion structure')
                )
            ));
            return false;
        }

        // Find the credential
        $credentials = PasskeyData::getCredentialsArray();
        $credential = null;
        
        foreach ($credentials as $cred) {
            if ($cred['id'] === $assertionData['id']) {
                $credential = $cred;
                break;
            }
        }

        if (!$credential) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Credential not found')
                )
            ));
            return false;
        }

        // Verify the assertion using WebAuthn library
        if ($this->validateAssertionResponse($assertionData, $credential)) {
            $this->sendFeedback(true, array(
                'success' => true,
                'message' => dgettext('plugin_passkey', 'Authentication successful')
            ));

            return true;
        } else {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Authentication failed')
                )
            ));
            return false;
        }
    }

    /**
     * Delete a passkey
     * @param array $action Action data
     * @return boolean Success status
     */
    private function deletePasskey($action)
    {
        if (!isset($action['credential_id'])) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Missing credential ID')
                )
            ));
            return false;
        }

        $credentialId = $action['credential_id'];
        PasskeyData::removeCredential($credentialId);

        $this->sendFeedback(true, array(
            'success' => true,
            'message' => dgettext('plugin_passkey', 'Passkey deleted successfully')
        ));

        return true;
    }

    /**
     * List user's passkeys
     * @param array $action Action data
     * @return boolean Success status
     */
    private function listPasskeys($action)
    {
        $credentials = PasskeyData::getCredentialsArray();
        
        // Remove sensitive data before sending to client
        $safeCredentials = array();
        foreach ($credentials as $cred) {
            $safeCredentials[] = array(
                'id' => $cred['id'],
                'name' => $cred['name'],
                'created' => $cred['created']
            );
        }

        $this->sendFeedback(true, array(
            'success' => true,
            'passkeys' => $safeCredentials
        ));

        return true;
    }

    /**
     * Get Relying Party entity for WebAuthn
     * @return PublicKeyCredentialRpEntity
     */
    private function getRpEntity()
    {
        $config = PasskeyData::getWebAuthnConfig();
        
        return PublicKeyCredentialRpEntity::create(
            $config['rp_name'],
            $config['rp_id']
        );
    }

    /**
     * Get user entity for WebAuthn
     * @return PublicKeyCredentialUserEntity
     */
    private function getUserEntity()
    {
        $username = $GLOBALS['mapisession']->getUserName();
        $userId = hash('sha256', $username); // Create consistent user ID
        
        return PublicKeyCredentialUserEntity::create(
            $username,
            $userId,
            $username
        );
    }

    /**
     * Validate WebAuthn attestation response using current v5.x approach
     * @param array $credentialData Credential data from client
     * @return PublicKeyCredentialSource|null
     */
    private function validateAttestationResponse($credentialData)
    {
        try {
            // Create serializer for loading credential data
            $attestationStatementSupportManager = AttestationStatementSupportManager::create();
            $attestationStatementSupportManager->add(NoneAttestationStatementSupport::create());
            
            // Create COSE Algorithm Manager for PackedAttestationStatementSupport
            $coseAlgorithmManager = Manager::create();
            $coseAlgorithmManager->add(ECDSA\ES256::create());
            $coseAlgorithmManager->add(RSA\RS256::create());
            
            $attestationStatementSupportManager->add(PackedAttestationStatementSupport::create($coseAlgorithmManager));
            
            $factory = new WebauthnSerializerFactory($attestationStatementSupportManager);
            $serializer = $factory->create();
            
            // Convert credential data to JSON for deserialization
            $jsonData = json_encode($credentialData);
            
            // Load the public key credential using serializer
            $publicKeyCredential = $serializer->deserialize(
                $jsonData,
                PublicKeyCredential::class,
                'json'
            );
            
            // Get the response
            $authenticatorAttestationResponse = $publicKeyCredential->response;
            
            if (!$authenticatorAttestationResponse instanceof AuthenticatorAttestationResponse) {
                return null;
            }
            
            // Create creation options - in production, these should be retrieved from session storage
            $rpEntity = $this->getRpEntity();
            $userEntity = $this->getUserEntity();
            $credentialParameters = [
                PublicKeyCredentialParameters::create('public-key', -7), // ES256
                PublicKeyCredentialParameters::create('public-key', -257), // RS256
            ];
            
            // Extract challenge from client data for validation
            $clientDataJSON = json_decode(base64_decode($credentialData['response']['clientDataJSON']), true);
            $challenge = base64_decode(strtr($clientDataJSON['challenge'], '-_', '+/'));
            
            $creationOptions = PublicKeyCredentialCreationOptions::create(
                $rpEntity,
                $userEntity,
                $challenge,
                $credentialParameters
            );
            
            // Validate the attestation response using current v5.x approach
            $host = $clientDataJSON['origin'] ? parse_url($clientDataJSON['origin'], PHP_URL_HOST) : $_SERVER['HTTP_HOST'];
            
            $publicKeyCredentialSource = $this->attestationValidator->check(
                $authenticatorAttestationResponse,
                $creationOptions,
                $host
            );
            
            return $publicKeyCredentialSource;
            
        } catch (Exception $e) {
            error_log("[passkey] Attestation validation error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Validate WebAuthn assertion response using current v5.x approach
     * @param array $assertionData Assertion data from client
     * @param array $storedCredential Stored credential data
     * @return boolean
     */
    private function validateAssertionResponse($assertionData, $storedCredential)
    {
        try {
            // Create serializer for loading credential data
            $attestationStatementSupportManager = AttestationStatementSupportManager::create();
            $attestationStatementSupportManager->add(NoneAttestationStatementSupport::create());
            
            // Create COSE Algorithm Manager for PackedAttestationStatementSupport
            $coseAlgorithmManager = Manager::create();
            $coseAlgorithmManager->add(ECDSA\ES256::create());
            $coseAlgorithmManager->add(RSA\RS256::create());
            
            $attestationStatementSupportManager->add(PackedAttestationStatementSupport::create($coseAlgorithmManager));
            
            $factory = new WebauthnSerializerFactory($attestationStatementSupportManager);
            $serializer = $factory->create();
            
            // Convert assertion data to JSON for deserialization
            $jsonData = json_encode($assertionData);
            
            // Load the public key credential using serializer
            $publicKeyCredential = $serializer->deserialize(
                $jsonData,
                PublicKeyCredential::class,
                'json'
            );
            
            // Get the response
            $authenticatorAssertionResponse = $publicKeyCredential->response;
            
            if (!$authenticatorAssertionResponse instanceof AuthenticatorAssertionResponse) {
                return false;
            }
            
            // Create request options - in production, these should be retrieved from session storage
            $rpEntity = $this->getRpEntity();
            $allowedCredentials = [
                PublicKeyCredentialDescriptor::create(
                    'public-key',
                    base64_decode(strtr($storedCredential['rawId'], '-_', '+/'))
                )
            ];
            
            // Extract challenge from client data for validation
            $clientDataJSON = json_decode(base64_decode($assertionData['response']['clientDataJSON']), true);
            $challenge = base64_decode(strtr($clientDataJSON['challenge'], '-_', '+/'));
            
            // Create request options using current v5.x approach
            $requestOptions = PublicKeyCredentialRequestOptions::create(
                $challenge,
                allowCredentials: $allowedCredentials,
                rpId: $rpEntity->id,
                timeout: 60000
            );
            
            // Get the stored credential source using the credential manager
            $publicKeyCredentialSource = $this->credentialManager->findOneByCredentialId(
                $publicKeyCredential->rawId
            );
            
            if (!$publicKeyCredentialSource) {
                return false;
            }
            
            // Validate the assertion response using current v5.x approach
            $host = $clientDataJSON['origin'] ? parse_url($clientDataJSON['origin'], PHP_URL_HOST) : $_SERVER['HTTP_HOST'];
            
            $publicKeyCredentialSource = $this->assertionValidator->check(
                $publicKeyCredentialSource,
                $authenticatorAssertionResponse,
                $requestOptions,
                $host,
                null // User handle
            );
            
            if ($publicKeyCredentialSource) {
                // Update the credential with new counter value
                $this->credentialManager->updateCredentialSource($publicKeyCredentialSource);
                return true;
            } else {
                return false;
            }
            
        } catch (Exception $e) {
            error_log("[passkey] Assertion validation error: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Send feedback to client
     * @param boolean $success Success status
     * @param array $data Response data
     * @param boolean $addResponseDataToBus Whether to add response data to bus
     */
    public function sendFeedback($success = false, $data = [], $addResponseDataToBus = true)
    {
        $response = array_merge(array('success' => $success), $data);
        $this->addActionData("passkey", $response);
        if ($addResponseDataToBus) {
            $GLOBALS["bus"]->addData($this->getResponseData());
        }
    }

    /**
     * Toggle activate/deactivate two-factor authentication
     *
     * @access private
     * @return boolean
     * @throws Exception
     */
    private function activate(): bool
    {
        $isActivated = PasskeyData::isActivated();
        PasskeyData::setActivate(!$isActivated);
        $response = array();
        $response['isActivated'] = !$isActivated;
        $this->addActionData("activate", $response);
        $GLOBALS["bus"]->addData($this->getResponseData());
        return true;
    }

    /**
     * Send if two-factor authentication is activated
     *
     * @access private
     * @return boolean
     * @throws Exception
     */
    private function isActivated(): bool
    {
        $isActivated = PasskeyData::isActivated();
        $response = array();
        $response['isActivated'] = $isActivated;
        $this->addActionData("isactivated", $response);
        $GLOBALS["bus"]->addData($this->getResponseData());
        return true;
    }
}
