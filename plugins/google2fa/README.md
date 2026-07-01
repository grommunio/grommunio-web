# grommunio Google 2FA Plugin

This plugin will integrate two-factor authorization with an external OTP provider (Google Authenticator App) in grommunio-web.

# Configuration

The plugin configuration can be found in the **'config.php'** file.

```const PLUGIN_GOOGLE2FA_ENABLE = true;```

* Enable/Disable plugin
* Default for new users, this doesn't mean the activation of two-factor authentication!

```const PLUGIN_GOOGLE2FA_ALWAYS_ENABLED = false;```

* Enable plugin when plugin is loading, the user can't disable the plugin.

```const PLUGIN_GOOGLE2FA_ACTIVATE = false;```

* Activate / deactivate 2FA
* Default for new users.

```const PLUGIN_GOOGLE2FA_ALWAYS_ACTIVATED = false;```

* Activate 2FA when plugin is loading.

