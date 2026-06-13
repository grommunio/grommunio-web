<?php

require_once __DIR__ . "/class.passkeydata.settings.php";

use Webauthn\PublicKeyCredentialSource;
use Webauthn\PublicKeyCredentialUserEntity;
use Webauthn\TrustPath\EmptyTrustPath;
use Symfony\Component\Uid\Uuid;

/**
 * Credential manager for WebAuthn passkeys
 * Updated to use current WebAuthn library v5.x best practices
 */
class PasskeyCredentialManager
{
    /**
     * Find a credential source by its credential ID
     * @param string $publicKeyCredentialId The credential ID
     * @return PublicKeyCredentialSource|null
     */
    public function findOneByCredentialId(string $publicKeyCredentialId): ?PublicKeyCredentialSource
    {
        // PasskeyData now uses EncryptionStore as primary storage, so just use it directly
        $credentials = PasskeyData::getCredentialsArray();
        $result = $this->searchCredentialsArray($credentials, $publicKeyCredentialId, "PasskeyData");
        if ($result) {
            return $result;
        }
        
        return null;
    }
    
    /**
     * Search for a credential in an array of credentials
     * @param array $credentials Array of credentials to search
     * @param string $publicKeyCredentialId The credential ID to find
     * @param string $storageType Storage type for logging
     * @return PublicKeyCredentialSource|null
     */
    private function searchCredentialsArray(array $credentials, string $publicKeyCredentialId, string $storageType): ?PublicKeyCredentialSource
    {
        foreach ($credentials as $credential) {
            // Try multiple comparison methods for backward compatibility
            $storedCredentialId = base64_decode(strtr($credential['rawId'], '-_', '+/'));
            
            // Direct binary comparison
            if ($storedCredentialId === $publicKeyCredentialId) {
                return $this->createCredentialSource($credential);
            }
            
            // Also try comparing the base64 encoded versions
            $publicKeyCredentialIdB64 = base64_encode($publicKeyCredentialId);
            if ($credential['rawId'] === $publicKeyCredentialIdB64) {
                return $this->createCredentialSource($credential);
            }
            
            // Try URL-safe base64 comparison
            $publicKeyCredentialIdB64UrlSafe = strtr($publicKeyCredentialIdB64, '+/', '-_');
            if ($credential['rawId'] === $publicKeyCredentialIdB64UrlSafe) {
                return $this->createCredentialSource($credential);
            }
        }
        
        return null;
    }

    /**
     * Find all credential sources for a user
     * @param PublicKeyCredentialUserEntity $publicKeyCredentialUserEntity The user entity
     * @return PublicKeyCredentialSource[]
     */
    public function findAllForUserEntity(PublicKeyCredentialUserEntity $publicKeyCredentialUserEntity): array
    {
        $credentials = PasskeyData::getCredentialsArray();
        $sources = [];
        
        foreach ($credentials as $credential) {
            $sources[] = $this->createCredentialSource($credential);
        }
        
        return $sources;
    }

    /**
     * Save a credential source
     * @param PublicKeyCredentialSource $publicKeyCredentialSource The credential source to save
     */
    public function saveCredentialSource(PublicKeyCredentialSource $publicKeyCredentialSource): void
    {
        $credential = [
            'id' => base64_encode($publicKeyCredentialSource->publicKeyCredentialId),
            'rawId' => base64_encode($publicKeyCredentialSource->publicKeyCredentialId),
            'publicKey' => base64_encode($publicKeyCredentialSource->credentialPublicKey),
            'signCount' => $publicKeyCredentialSource->counter,
            'userHandle' => $publicKeyCredentialSource->userHandle,
            'created' => time(),
            'name' => 'WebAuthn Credential' // Default name, should be set elsewhere
        ];
        
        PasskeyData::addCredential($credential);
    }

    /**
     * Update a credential source (for counter updates after authentication)
     * @param PublicKeyCredentialSource $publicKeyCredentialSource The credential source to update
     */
    public function updateCredentialSource(PublicKeyCredentialSource $publicKeyCredentialSource): void
    {
        $credentials = PasskeyData::getCredentialsArray();
        $credentialId = base64_encode($publicKeyCredentialSource->publicKeyCredentialId);
        
        for ($i = 0; $i < count($credentials); $i++) {
            if ($credentials[$i]['rawId'] === $credentialId) {
                $credentials[$i]['signCount'] = $publicKeyCredentialSource->counter;
                $credentials[$i]['lastUsed'] = time();
                break;
            }
        }
        
        PasskeyData::setCredentials(json_encode($credentials));
    }

    /**
     * Create a PublicKeyCredentialSource from stored credential data
     * @param array $credential Stored credential data
     * @return PublicKeyCredentialSource
     */
    private function createCredentialSource(array $credential): PublicKeyCredentialSource
    {
        // Decode credential ID from stored format
        $credentialId = base64_decode(strtr($credential['rawId'], '-_', '+/'));
        $counter = isset($credential['signCount']) ? (int)$credential['signCount'] : 0;
        
        // Handle public key - should be proper COSE key format from WebAuthn v5.x validation
        $publicKey = '';
        if (isset($credential['publicKey']) && !empty($credential['publicKey'])) {
            try {
                $publicKey = base64_decode(strtr($credential['publicKey'], '-_', '+/'));
            } catch (Exception $e) {
                error_log("[passkey] Error decoding public key: " . $e->getMessage());
                $publicKey = '';
            }
        }
        
        // Handle user handle properly - WebAuthn library v5.x expects string|null
        $userHandle = null;  // Default to null for v5.x compatibility
        if (isset($credential['userHandle']) && !empty($credential['userHandle'])) {
            // Use the stored user handle as-is since it comes from validated WebAuthn response
            $userHandle = $credential['userHandle'];
        }
        
        // Create a proper UUID for AAGUID - using a fixed UUID for consistency
        $aaguid = Uuid::fromString('00000000-0000-0000-0000-000000000000');
        
        // Use the correct v5.x constructor with proper parameter order
        return new PublicKeyCredentialSource(
            $credentialId,           // publicKeyCredentialId (string)
            'public-key',           // type (string)
            [],                     // transports (array)
            'none',                 // attestationType (string)
            new EmptyTrustPath(),   // trustPath (TrustPath)
            $aaguid,                // aaguid (Uuid)
            $publicKey,             // credentialPublicKey (string)
            $userHandle,            // userHandle (string|null)
            $counter                // counter (int)
        );
    }
}

// Keep the old class name for backward compatibility but mark as deprecated
/**
 * @deprecated Use PasskeyCredentialManager instead. This class will be removed in a future version.
 */
class PasskeyCredentialRepository extends PasskeyCredentialManager
{
    // Empty - just extends the new manager for backward compatibility
}
