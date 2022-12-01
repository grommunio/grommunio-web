# grommunio Web

[![project license](https://img.shields.io/github/license/grommunio/grommunio-web.svg)](LICENSE.txt)
[![latest version](https://shields.io/github/v/tag/grommunio/grommunio-web)](https://github.com/grommunio/grommunio-web/tags)
[![scrutinizer](https://img.shields.io/scrutinizer/build/g/grommunio/grommunio-web)](https://scrutinizer-ci.com/g/grommunio/grommunio-web/)
[![code size](https://img.shields.io/github/languages/code-size/grommunio/grommunio-web)](https://github.com/grommunio/grommunio-web)

[![pull requests welcome](https://img.shields.io/badge/PRs-welcome-ff69b4.svg)](https://github.com/grommunio/grommunio-web/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22)
[![code with love by grommunio](https://img.shields.io/badge/%3C%2F%3E%20with%20%E2%99%A5%20by-grommunio-ff1414.svg)](https://grommunio.com)
[![twitter](https://img.shields.io/twitter/follow/grommunio?style=social)](https://twitter.com/grommunio)

**grommunio Web is an open-source application to Webhronize Exchange ActiveSync (EAS) compatible devices such as mobile phones and tablets.**

**grommunio Web is on open-source web application and provides all the familiar email, advanced calendaring and contact features you need to be productive. It is the main web application for access to your productivity workspace, including email, calendar, contacts, tasks, notes and more.

_grommunio Web is also the basis for grommunio Desktop, a cross-platform client designed to run on your desktop without any specific browser requirements._

<details open="open">
<summary>Overview</summary>

- [About](#about)
  - [Built with](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Status](#status)
- [Support](#support)
- [Project assistance](#project-assistance)
- [Contributing](#contributing)
- [Security](#security)
- [Coding style](#coding-style)
- [License](#license)

</details>

---

## About grommunio Web

- Provides **web-based** groupware (emails, contacts, calendar, tasks and notes) connectivity
- Includes **extensions** integrating grommunio Meet, Chat Archive and more
- **Compatible**, works with any modern web browser such as Chrome, Edge, Firefox, Safari and others
- **Easy to use**, providing a polished interface with nearly no training required for users 
- **Distributable**, compatible with load balancers such as haproxy, apisix, KEMP and others
- **Scalable**, capable of running with tens of thousands of sessions concurrently
- **Fast** with a snappy interface which reacts almost immediately to user interactions
- **Secure**, with certifications through independent security research and validation

### Compatible with

- PHP **7.4+**, PHP **8.0** and **8.1**
- PHP modules: json, xml, gd, gettext, mapi
- PHP backend: gromox-zcore

## Getting Started

### Prerequisites

- A working **web server**, with a working **TLS** configuration (nginx recommended)
- **PHP**, preferably available as fpm pool
- **Zcore** MAPI transport (provided by [gromox](https://github.com/grommunio/gromox))

### Installation

- Deploy grommunio-web at a location of your choice, such as **/usr/share/grommunio-web**
- Validate the configuration file as config.php, see **[/config.php](/config.php)**
- Adapt web server configuration according to your needs, **[/build](/build)** provides some examples
- Prepare PHP configuration according to your needs, **[/build](/build)** provides some examples

## Status

- [Top Feature Requests](https://github.com/grommunio/grommunio-web/issues?q=label%3Aenhancement+is%3Aopen+sort%3Areactions-%2B1-desc) (Add your votes using the 👍 reaction)
- [Top Bugs](https://github.com/grommunio/grommunio-web/issues?q=is%3Aissue+is%3Aopen+label%3Abug+sort%3Areactions-%2B1-desc) (Add your votes using the 👍 reaction)
- [Newest Bugs](https://github.com/grommunio/grommunio-web/issues?q=is%3Aopen+is%3Aissue+label%3Abug)

## Support

- Support is available through **[grommunio GmbH](https://grommunio.com)** and its partners.
- grommunio Web community is available here: **[grommunio Community](https://community.grommunio.com)**

For direct contact to the maintainers (for example to supply information about a security-related responsible disclosure), you can contact grommunio directly at [dev@grommunio.com](mailto:dev@grommunio.com)

## Project assistance

If you want to say **thank you** or/and support active development of grommunio Web:

- Add a [GitHub Star](https://github.com/grommunio/grommunio-web) to the project.
- Tweet about grommunio Web.
- Write interesting articles about the project on [Dev.to](https://dev.to/), [Medium](https://medium.com/), your personal blog or any medium you feel comfortable with.

Together, we can make grommunio Web **better**!

## Contributing

First off, thanks for taking the time to contribute! Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make will benefit everybody else and are **greatly appreciated**.

## Security

grommunio Web follows good practices of security. grommunio constantly monitors security-related issues.
grommunio Web is provided **"as is"** without any **warranty**. For professional support options through subscriptions, head over to [grommunio](https://grommunio.com).

## Development

### Coding style

This repository follows a customized coding style. The coding style can be validated anytime by the repositories provided [configuration file](.phpcs).

### Setup development environment

To get started, make sure you have a working set of the following components:

- gromox-http
- gromox-zcore
- php-mapi
- nginx

Checkout the repository into a new directory, e.g. "/usr/share/grommunio-web-dev". The new path of grommunio-web is now "/usr/share/grommunio-web-dev/".

If you want to use the existing grommunio-web config, point config.php to it: ```ln -s /etc/grommunio-web/config.php /opt/grommunio-web/config.php``` or use the "config.php.dist": ```cp -p /usr/share/grommunio-web-dev/config.php.dist /usr/share/grommunio-web-dev/config.php```.

Also, copy the defaults.php: ```ln -s /etc/grommunio-web/defaults.php /opt/grommunio-web/defaults.php``` or use the "defaults.php.dist": ```cp -p /usr/share/grommunio-web-dev/defaults.php.dist /usr/share/grommunio-web-dev/defaults.php```. Finally, make sure to adjust "/usr/share/grommunio-web-dev/defaults.php" to use sources instead of the release version. Search for ```if(!defined('DEBUG_LOADER')) define('DEBUG_LOADER', LOAD_RELEASE);``` and replace it with ```if(!defined('DEBUG_LOADER')) define('DEBUG_LOADER', LOAD_SOURCE);```. 

At last, adjust (or copy) the nginx config file "/usr/share/grommunio-common/nginx/locations.d/grommunio-web.conf" by replacing ```alias /usr/share/grommunio-web/;``` with ```alias /usr/share/grommunio-web-dev/;```. Reload nginx: ```systemctl reload nginx```.

## Translators

For performance reasons, the languages are loaded into the shared memory of the running system. After translation changes, re-generate the gettext strings (see _Makefile_) and make sure you clear the shared memory:

```
ipcrm -M 0x950412de
```

The translations are managed by [Weblate](https://hosted.weblate.org/projects/grommunio/grommunio-web/). Contributions are regularly monitored and integrated in the release cycles of grommunio Web.

## License

This project is licensed under the **GNU Affero General Public License v3**.

See [LICENSE.txt](LICENSE.txt) for more information.
