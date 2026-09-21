<?php

require_once __DIR__ . "/vendor/autoload.php";
require_once __DIR__ . "/class.passkeydata.settings.php";
require_once __DIR__ . "/class.passkeycredentialrepository.php";

use Webauthn\PublicKeyCredential;
use Webauthn\PublicKeyCredentialCreationOptions;
use Webauthn\PublicKeyCredentialRpEntity;
use Webauthn\PublicKeyCredentialUserEntity;
use Webauthn\AuthenticatorAttestationResponse;
use Webauthn\AuthenticatorAttestationResponseValidator;
use Webauthn\AttestationStatement\AttestationStatementSupportManager;
use Webauthn\AttestationStatement\NoneAttestationStatementSupport;
use Webauthn\Denormalizer\WebauthnSerializerFactory;
use Webauthn\CeremonyStep\CeremonyStepManagerFactory;

/**
 * Passkey Module for handling passkey administration actions.
 *
 * Registration/listing/deletion are handled server-side in PHP: registration
 * verifies the WebAuthn attestation and stores the credential via PasskeyData,
 * while listing/deletion read from and mutate that same PasskeyData store. This
 * module only serves the authenticated user's requests and toggles the per-user
 * activation flag. The WebAuthn assertion ceremony for the SECOND-FACTOR login
 * lives in login.php/logon.php, not here.
 *
 * @class PasskeyModule
 * @extends Module
 */
class PasskeyModule extends Module
{
    /**
     * @constructor
     * @param int $id unique id.
     * @param array $data list of all actions.
     */
    public function __construct($id, $data)
    {
        parent::__construct($id, $data);
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
                    // Defense in depth: the core gate in grommunio.php already
                    // blocks every module action for a pending session, but guard
                    // the sensitive ones explicitly so registering, deleting,
                    // listing or minting a challenge can never happen while the
                    // second factor is unsatisfied - even if that path changes.
                    if (WebAppAuthentication::secondFactorPending() &&
                        in_array($action["passkey_action"], ['register', 'delete', 'list', 'challenge', 'activate'], true)) {
                        $this->sendFeedback(false, array(
                            'type' => ERROR_GENERAL,
                            'info' => array(
                                'message' => dgettext('plugin_passkey', 'Authentication failed')
                            )
                        ));

                        return false;
                    }

                    switch ($action["passkey_action"]) {
                        case "register":
                            $result = $this->registerPasskey($action);
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
                        case "challenge":
                            $result = $this->getChallenge();
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
     * Register a new passkey.
     *
     * The browser performs the WebAuthn attestation ceremony and hands the result
     * here. We read+consume the single-use server challenge, verify the attestation
     * in PHP (RP-ID server-authoritative, fail closed), and store the VERIFIED
     * credential via PasskeyData — the same store logon.php reads for assertion.
     *
     * @param array $action Action data
     * @return boolean Success status
     */
    private function registerPasskey($action)
    {
        if (!isset($action['credential_data']) || !isset($action['name'])) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array('message' => dgettext('plugin_passkey', 'Missing registration data'))
            ));
            return false;
        }

        // Read + CONSUME the single-use registration challenge.
        $encryptionStore = EncryptionStore::getInstance();
        $challenge = $encryptionStore->get('passkeyRegistrationChallenge');
        $encryptionStore->remove('passkeyRegistrationChallenge');
        if (empty($challenge)) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array('message' => dgettext('plugin_passkey', 'Invalid or expired challenge'))
            ));
            return false;
        }

        $credential = json_decode($action['credential_data'], true);
        if (!$credential) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array('message' => dgettext('plugin_passkey', 'Invalid credential data'))
            ));
            return false;
        }

        $username = $GLOBALS['mapisession']->getUserName();
        $verified = $this->verifyAttestation($credential, $challenge, $username);
        if ($verified === null) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array('message' => dgettext('plugin_passkey', 'Failed to register passkey'))
            ));
            return false;
        }

        PasskeyData::addCredential(array(
            'id' => $verified['rawId'],
            'rawId' => $verified['rawId'],
            'publicKey' => $verified['publicKey'],
            'signCount' => $verified['signCount'],
            'userHandle' => $verified['userHandle'],
            'name' => $action['name'],
            'created' => time(),
        ));

        $this->sendFeedback(true, array(
            'success' => true,
            'message' => dgettext('plugin_passkey', 'Passkey registered successfully')
        ));
        return true;
    }

    /**
     * Delete one of the current user's passkeys by its credential id (base64url rawId).
     *
     * @param array $action Action data
     * @return boolean Success status
     */
    private function deletePasskey($action)
    {
        if (!isset($action['credential_id'])) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array('message' => dgettext('plugin_passkey', 'Missing credential ID'))
            ));
            return false;
        }

        PasskeyData::removeCredential($action['credential_id']);
        $this->sendFeedback(true, array(
            'success' => true,
            'message' => dgettext('plugin_passkey', 'Passkey deleted successfully')
        ));
        return true;
    }

    /**
     * List the current user's passkeys from PasskeyData.
     *
     * @param array $action Action data
     * @return boolean Success status
     */
    private function listPasskeys($action)
    {
        $credentials = PasskeyData::getCredentialsArray();
        $passkeys = array();
        foreach ($credentials as $cred) {
            $passkeys[] = array(
                'id' => isset($cred['rawId']) ? $cred['rawId'] : (isset($cred['id']) ? $cred['id'] : ''),
                'name' => isset($cred['name']) ? $cred['name'] : '',
                'created' => isset($cred['created']) ? ($cred['created'] * 1000) : null,
            );
        }
        $this->sendFeedback(true, array(
            'success' => true,
            'passkeys' => $passkeys
        ));
        return true;
    }

    /**
     * Mint a single-use, server-side registration challenge and stash it in the
     * EncryptionStore (distinct key from the assertion challenge). Returned to the
     * browser for navigator.credentials.create(); consumed on register.
     *
     * @return bool
     */
    private function getChallenge()
    {
        $timeoutMs = defined('PLUGIN_PASSKEY_TIMEOUT') ? PLUGIN_PASSKEY_TIMEOUT : 60000;
        $challenge = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
        $encryptionStore = EncryptionStore::getInstance();
        $encryptionStore->add('passkeyRegistrationChallenge', $challenge, time() + intval($timeoutMs / 1000) + 30);
        $this->sendFeedback(true, array(
            'success' => true,
            'challenge' => $challenge,
        ));
        return true;
    }

    /**
     * Verify a WebAuthn attestation (registration) with the vendored
     * web-auth/webauthn-lib. RP-ID is SERVER-authoritative (config), never
     * derived from client input; if it is not configured we fail closed.
     *
     * @param array  $credential  Decoded attestation credential (client JSON)
     * @param string $challengeB64 The server-minted, already-consumed challenge (base64url)
     * @param string $username    Authenticated username (from MAPI session)
     * @return array|null [rawId(base64url), publicKey(base64url), signCount(int)] or null on failure
     */
    private function verifyAttestation($credential, $challengeB64, $username)
    {
        try {
            $config = PasskeyData::getWebAuthnConfig();
            if (empty($config['rp_id'])) {
                error_log("[passkey] Refusing registration: PLUGIN_PASSKEY_RP_ID not configured (fail closed).");
                return null;
            }

            // Serializer to deserialize the client PublicKeyCredential (same as logon.php).
            $attestationStatementSupportManager = AttestationStatementSupportManager::create();
            $attestationStatementSupportManager->add(NoneAttestationStatementSupport::create());
            $factory = new WebauthnSerializerFactory($attestationStatementSupportManager);
            $serializer = $factory->create();

            $publicKeyCredential = $serializer->deserialize(json_encode($credential), PublicKeyCredential::class, 'json');
            $attestationResponse = $publicKeyCredential->response;
            if (!$attestationResponse instanceof AuthenticatorAttestationResponse) {
                return null;
            }

            // Rebuild the creation options that were in effect for this ceremony.
            // The challenge is the raw bytes of the server-minted base64url value.
            $challengeBytes = base64_decode(strtr($challengeB64, '-_', '+/'));
            $rpEntity = PublicKeyCredentialRpEntity::create($config['rp_name'], $config['rp_id']);
            $userEntity = PublicKeyCredentialUserEntity::create($username, $username, $username);
            $creationOptions = PublicKeyCredentialCreationOptions::create(
                $rpEntity,
                $userEntity,
                $challengeBytes,
                [],
                null,
                'none',
                [],
                (int) $config['timeout']
            );

            $csmFactory = new CeremonyStepManagerFactory();
            $validator = AuthenticatorAttestationResponseValidator::create(
                $csmFactory->creationCeremony()
            );

            // 3rd arg is the expected host; pass the SERVER-configured RP-ID.
            $record = $validator->check($attestationResponse, $creationOptions, $config['rp_id']);

            return [
                'rawId' => rtrim(strtr(base64_encode($record->publicKeyCredentialId), '+/', '-_'), '='),
                'publicKey' => rtrim(strtr(base64_encode($record->credentialPublicKey), '+/', '-_'), '='),
                'signCount' => $record->counter,
                'userHandle' => $record->userHandle,
            ];
        } catch (Exception $e) {
            error_log("[passkey] Attestation verification failed: " . $e->getMessage());
            return null;
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
        // Defense in depth: never allow toggling the second factor from a
        // half-authenticated session. The core gate in grommunio.php already
        // blocks this (a pending session cannot reach execute()), but guard
        // explicitly in case that path ever changes.
        if (WebAppAuthentication::secondFactorPending()) {
            $this->sendFeedback(false, array(
                'type' => ERROR_GENERAL,
                'info' => array(
                    'message' => dgettext('plugin_passkey', 'Authentication failed')
                )
            ));
            return false;
        }

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
