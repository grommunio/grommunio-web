# Archive Plugin

## Introduction
This plugin adds grommunio Archive to the top menu bar which can be used to open inside grommunio Web.

## Configuration
The configuration of this plugin is done in the config.php file of this plugin. It contains the following defines:

```php
define('PLUGIN_ARCHIVE_USER_DEFAULT_ENABLE', true);
```
Set PLUGIN_ARCHIVE_USER_DEFAULT_ENABLE to true to enable this plugin by default for (new) users.

```php
define('PLUGIN_ARCHIVE_URL', 'https://' . $_SERVER['HTTP_HOST'] . '/archive/');
```
Set PLUGIN_ARCHIVE_URL to the URL under which grommunio Archive is available.

```php
define('PLUGIN_ARCHIVE_AUTOSTART', false);
```
Set PLUGIN_ARCHIVE_AUTOSTART to true to automatically open up a tab after Login.
