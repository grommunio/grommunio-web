# grommunio Passkey Plugin

This plugin will integrate a WebAuthn passkey authentication into grommunio-web.

## Configuration

The plugin configuration can be found in the **'config.php'** file.

```define('PLUGIN_PASSKEY_ENABLE', true);```

This configuration flag will enable/disable the plugin by default for all users. If this is set to false, each user has to enable
the plugin by itself in the web settings. (Settings -> Plugins -> Check the passkey plugin)

```define('PLUGIN_PASSKEY_ACTIVATE', false);```

If this flag is true, passkey login available during login.

```define('PLUGIN_PASSKEY_RP_ID', 'your-domain.com');```

**Required.** Set this to the domain users log in to. It is the server-authoritative
WebAuthn Relying Party ID and expected origin, and is never derived from the request host
or the browser. If it is left empty the passkey ceremony **fails closed** (authentication is
denied) rather than trusting client-supplied values, so passkey login will not work until an
administrator configures it.

```define('PLUGIN_PASSKEY_RP_NAME', 'Your Organization');```

This flag will display information about your organization in the passkey.

```define('PLUGIN_PASSKEY_TIMEOUT', 60000);```

This flag configured the default timeout for passkey logins.

```define('PLUGIN_PASSKEY_USER_VERIFICATION', 'preferred);```

This flag configures the way user verification will take place.

```define('PLUGIN_PASSKEY_AUTHENTICATOR_ATTACHMENT', null);```

This flag configures options for an authenticator attachement.
