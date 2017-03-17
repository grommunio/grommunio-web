Tools directory
===============

This directory contains the required tools to build the WebApp.

Updating translations
---------------------

The WebApp PHP and JavaScript translations can be updated using the
update_translations.sh script. Execute the scripts in the root directory of
WebApp

$ ./tools/update_translations.sh

The exisiting po files in server/language will be updated with the new
translation strings from the JavaScript and PHP code. Obsolete strings are
automatically removed.

Adding a new language
---------------------

A new language can be added as following.

$ ./tools/update_translations.sh nl_NL
