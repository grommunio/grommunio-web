# Kopano WebApp

WebApp provides all the familiar email, advanced calendaring and contacts
features you need to be productive. It helps you by providing an overview of
what matters to you, whether this is your incoming email, your weekly schedule
or the contact details of that person you really need to call.

# Dependencies
The following dependencies are required:

* PHP - with json, xml and gettext modules
* php-mapi
* gettext - for msgfmt (translations)
* libxml2-utils - for xmllint
* ant, ant-contrib - for deploying JavaScript
* compass - for generating css files.

Optional for development a pre-commit hook can be used, which runs JSHint.

```
  npm install
```

# Running static analysis

After setting the dependencies using ```npm install```, jshint can be run as
following.

```
npm run lint
```


Running PHP linting, requires [phpmd](https://phpmd.org/about.html) to be installed:

```
npm run phplint
```

# Tests

JavaScript unittest can be run with the following command and are located in test/js.

```
npm run jsunit
```

Generate xml output for Jenkins
```
npm run jsunit -- --reporters junit
```

Run coverage, output file in test/js/coverage

```
npm run jsunit -- --reporters coverage
```

# Documentation
In-depth documentation, such as administration and user manuals about our
products can be found on our [Documentation Portal](
https://documentation.kopano.io/). Additionally, a [Knowledge Base](
https://kb.kopano.io/) is available for quick start guides, handy code
snippets, and troubleshooting help.

# Contributing
The main development of Kopano WebApp takes place in a [Bitbucket
instance](https://stash.kopano.io/projects/KW/repos/kopano-webapp/browse) with
development tickets organised in [Jira](https://jira.kopano.io/projects/KW/).
Please see [CONTRIBUTING.md](CONTRIBUTING.md) for steps on how to contribute
patches.

# Downloading compiled packages
Nightly builds of the ```master``` branch can be downloaded from
https://download.kopano.io/. In addition to this, QAed builds of the
```release``` and ```stable``` branches are available to subscription holders
from the [Kopano Portal](https://portal.kopano.com/) and a [package
repository](
https://kb.kopano.io/display/WIKI/Install+and+upgrade+Kopano+products+using+repositories).

# Support
Community Support is available through the [Kopano
Forum](https://forum.kopano.io/) and through the ```#kopano``` channel on the
Freenode IRC network. [Additional support options](https://kopano.com/support/)
are available for subscription holders.
