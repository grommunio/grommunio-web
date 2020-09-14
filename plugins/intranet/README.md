# Intranet Plugin

## Introduction
This plugin adds one or more buttons in the top menu bar which can be used to open a webpage inside Grammm WebApp.


## Configuration
The configuration of this plugin is done in the config.php file of this plugin. It contains the following defines:


```php
define('PLUGIN_INTRANET_USER_DEFAULT_ENABLE', true);
```
Set PLUGIN_INTRANET_USER_DEFAULT_ENABLE to true to enable this plugin by default for (new) users.

```php
define('PLUGIN_INTRANET_BUTTON_TITLE', 'Kopano.io');
define('PLUGIN_INTRANET_URL', 'http://www.kopano.io/');
```
PLUGIN_INTRANET_BUTTON_TITLE defines the title of the button in the top menu bar and of the tab when it is opened.
PLUGIN_INTRANET_URL defines the URL of the webpage that is loaded in the tab panel when it is opened.

```php
define('PLUGIN_INTRANET_BUTTON_TITLE_1', 'Kopano.com');
define('PLUGIN_INTRANET_URL_1', 'http://kopano.com/');

```
To add more buttons that open a webpage, just define them like above with a number at the end. The numbers must start with 1 and must be consecutive.


## Good to know
It is not possible to open a website that has a different protocol as the WebApp itself. E.g. it is not possible to open a webpage that starts with https when the WebApp runs under http.
Some sites, e.g. https://google.com don't allow browser to load them in an iframe, therfore it is not possible to use these sites with this plugin.