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
 * Relying Party (RP) ID - should match your domain
 * This should be set to your grommunio domain
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
