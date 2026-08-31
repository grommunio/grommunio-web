<?php

/**
 * Configuration for Passkey plugin
 */

/**
 * Enable/Disable plugin
 * Default for new users, this doesn't mean the activation of passkey authentication!
 */
const PLUGIN_PASSKEY_ENABLE = true;

/**
 * Activate/Deactivate passkey authentication
 * Default for new users.
 */
const PLUGIN_PASSKEY_ACTIVATE = false;

/**
 * Relying Party (RP) ID - the domain the passkey is scoped to.
 *
 * REQUIRED. This must be set to the domain users log in to (e.g. 'mail.example.com').
 * It is the server-authoritative WebAuthn Relying Party ID and expected origin;
 * it is deliberately NEVER derived from the request Host header or the browser's
 * clientDataJSON.origin. If this is left empty the passkey ceremony fails closed
 * (authentication is denied) rather than trusting client-supplied values.
 */
const PLUGIN_PASSKEY_RP_ID = '';

/**
 * Relying Party (RP) Name - human readable name for your organization
 */
const PLUGIN_PASSKEY_RP_NAME = 'Grommunio Web';

/**
 * Timeout for WebAuthn operations in milliseconds
 */
const PLUGIN_PASSKEY_TIMEOUT = 60000;

/**
 * User verification requirement
 * Options: 'required', 'preferred', 'discouraged'
 */
const PLUGIN_PASSKEY_USER_VERIFICATION = 'preferred';

/**
 * Authenticator attachment preference
 * Options: 'platform', 'cross-platform', null (no preference)
 */
const PLUGIN_PASSKEY_AUTHENTICATOR_ATTACHMENT = null;
