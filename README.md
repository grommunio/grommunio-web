# grommunio web

WebApp provides all the familiar email, advanced calendaring and contacts
features you need to be productive. It helps you by providing an overview of
what matters to you, whether this is your incoming email, your weekly schedule
or the contact details of that person you really need to call.

# Dependencies
The following dependencies are required:

* PHP - with json, xml, gd and gettext modules
* php-mapi
* gettext - for msgfmt (translations)
* libxml2-utils - for xmllint
* ant, ant-contrib - for deploying JavaScript
* compass - for generating css files.
* make

Optional for development a pre-commit hook can be used, which runs JSHint.

```
  npm install
```

# Running static analysis


ESLint is used for JavaScript linting.

```
make lint
```

Running PHP linting, requires [phpmd](https://phpmd.org/about.html) to be installed:

```
npm run phplint
```

# Tests

JavaScript unittest can be run with the following command and are located in test/js.

```
make test
```

Run coverage, output file in test/js/coverage

```
make open-coverage
```

#clear language resource shm

```
ipcrm -M 0x950412de
```

#custom the system-wide theme
copy "plugins/themeexample" under source code to "plugins" directory under install path of webapp
replace your own jpg and png files under "img" and "theme.css" under "css" folder
find THEME in config.php and change it to blow
define("THEME", 'themeexample');

#Development
Checkout the repository into a new directory, e.g. "/opt". The new path of grommunio-web is now "/opt/grommunio-web/".

If you want to use the existing grommunio-web config, point config.php to it: ```ln -s /etc/grommunio-web/config.php /opt/grommunio-web/config.php```. Or use the "debug.php.dist": ```cp -p /opt/grommunio-web/config.php.dist /opt/grommunio-web/config.php```.

Adjust "/opt/grommunio-web/defaults.php" to use sources instead of the release version. Search for ```if(!defined('DEBUG_LOADER')) define('DEBUG_LOADER', LOAD_RELEASE);``` and replace it with ```if(!defined('DEBUG_LOADER')) define('DEBUG_LOADER', LOAD_SOURCE);```. 

Adjust the nginx config file "/usr/share/grommunio-common/nginx/locations.d/grommunio-web.conf" by replacing ```alias /usr/share/grommunio-web/;``` with ```alias /opt/grommunio-web/;```. Reload nginx: ```systemctl reload nginx```.

