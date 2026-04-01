<?php

// Enable the plugin by default for all users
define('PLUGIN_TEMPLATESNIPPETS_USER_DEFAULT_ENABLE', false);

// Directory where system-provided templates are stored.
// This path survives package upgrades.
define('PLUGIN_TEMPLATESNIPPETS_SYSTEM_DIR', '/var/lib/grommunio-web/templates');

// Admin users who may create, edit, and delete system-provided templates.
// Use SMTP addresses (the login identity) to identify administrators.
// Example: ['admin@example.com', 'postmaster@example.com']
define('PLUGIN_TEMPLATESNIPPETS_ADMIN_USERS', []);
