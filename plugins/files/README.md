# grommunio Files Plugin

This plugin will integrate external storage providers in grommunio-web.

# Dependencies

This plugin requires the following dependencies:

* PHP Curl
* php-sodium

# Configuration

The plugin configuration can be found in the **'config.php'** file.

```define('PLUGIN_FILES_USER_DEFAULT_ENABLE', true);```

This configuration flag will enable/disable the plugin by default for all users. If this is set to false, each user has to enable
the plugin by itself in the web settings. (Settings -> Plugins -> Check the files plugin)

```define('PLUGIN_FILES_ASK_BEFORE_DELETE', true);```

If this flag is true, a confirmation dialog will be shown before a file gets deleted. Otherwise the file is deleted instantly (dangerous!).

```define('PLUGIN_FILES_CACHE_DIR', "/var/lib/grommunio-web/plugin_files");```

The directory where to save cache files for phpfastcache, if redis is not available.

```define('PLUGIN_FILESBROWSER_LOGLEVEL', "ERROR");```

If you experience any problems with the plugin, set this flag to **'DEBUG'** and send your nginx/php-fpm/grommunio web error log to the grommunio developers.

```define('FILES_ACCOUNTSTORE_V1_SECRET_KEY', "");```

The secret key for the acount data encryption when "Use grommunio Credentials" is not used. A random secret can be
generated with: `openssl rand -hex 32`.

```define('PLUGIN_FILES_REDIS_HOST', 'localhost');```

Redis host for phpFastCache.

```define('PLUGIN_FILES_REDIS_PORT', '6379');```

Redis port for phpFastCache.

```define('PLUGIN_FILES_REDIS_AUTH', '');```

Redis authentication for phpFastCache - leave empty to connect without authentication (default)
