Ext.namespace('Zarafa.plugins.passkey.data');

/**
 * @class Zarafa.plugins.passkey.data.Configuration
 * @extends Object
 * 
 * Configuration class for the Passkey plugin
 */
Zarafa.plugins.passkey.data.Configuration = {

    activate: undefined,
    /**
     * Initialize the configuration
     */
    init: function() {
        // Plugin configuration initialization
        this.webauthnSupported = this.checkWebAuthnSupport();
        let a = new Zarafa.plugins.passkey.data.ResponseHandler({
            successCallback: this.gotIsActivated.createDelegate(this)
        });
        container.getRequest().singleRequest("passkeymodule", "isactivated", {}, a);
    },

    gotIsActivated: function (a) {
        this.activate = a.isActivated;
    },

    isActivated: function (a) {
        return this.activate;
    },

    /**
     * Check if WebAuthn is supported by the browser
     * @return {Boolean} True if WebAuthn is supported
     */
    checkWebAuthnSupport: function() {
        return !!(navigator.credentials && navigator.credentials.create && navigator.credentials.get && window.PublicKeyCredential);
    },

    /**
     * Get WebAuthn configuration from server settings
     * @return {Object} WebAuthn configuration object
     */
    getWebAuthnConfig: function() {
        let settingsModel = container.getSettingsModel();
        return {
            rpId: settingsModel.get('zarafa/v1/plugins/passkey/rp_id') || window.location.hostname,
            rpName: settingsModel.get('zarafa/v1/plugins/passkey/rp_name') || 'Grommunio',
            timeout: settingsModel.get('zarafa/v1/plugins/passkey/timeout') || 60000,
            userVerification: settingsModel.get('zarafa/v1/plugins/passkey/user_verification') || 'preferred',
            authenticatorAttachment: settingsModel.get('zarafa/v1/plugins/passkey/authenticator_attachment') || null
        };
    },

    /**
     * Get user information for WebAuthn
     * @return {Object} User information object
     */
    getUserInfo: function() {
        let userStore = container.getUser();
        return {
            id: new TextEncoder().encode(userStore.getUserName()),
            name: userStore.getUserName(),
            displayName: userStore.getDisplayName() || userStore.getUserName()
        };
    },

    /**
     * Generate a random challenge for WebAuthn
     * @return {Uint8Array} Random challenge bytes
     */
    generateChallenge: function() {
        return new Uint8Array(32).map(() => Math.floor(Math.random() * 256));
    },

    /**
     * Convert ArrayBuffer to Base64URL
     * @param {ArrayBuffer} buffer The buffer to convert
     * @return {String} Base64URL encoded string
     */
    arrayBufferToBase64Url: function(buffer) {
        let bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },

    /**
     * Convert Base64URL to ArrayBuffer
     * @param {String} base64url Base64URL encoded string
     * @return {ArrayBuffer} Decoded buffer
     */
    base64UrlToArrayBuffer: function(base64url) {
        let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        let binary = atob(base64);
        let bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    /**
     * Check if passkey authentication is enabled
     * @return {Boolean} True if enabled
     */
    isPasskeyEnabled: function() {
        let settingsModel = container.getSettingsModel();
        return settingsModel.get('zarafa/v1/plugins/passkey/enable') === true;
    },

    /**
     * Check if passkey authentication is activated for the user
     * @return {Boolean} True if activated
     */
    isPasskeyActivated: function() {
        let settingsModel = container.getSettingsModel();
        return settingsModel.get('zarafa/v1/plugins/passkey/activate') === true;
    }
};
