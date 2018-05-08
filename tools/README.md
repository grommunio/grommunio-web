Tools directory
===============

This directory contains the required tools to build the WebApp.

Updating translations
---------------------

The WebApp PHP and JavaScript translations can be updated using the
update_translations script. Execute the scripts in the root directory of
WebApp

$ ./tools/update_translations -u

The exisiting po files in server/language will be updated with the new
translation strings from the JavaScript and PHP code. Obsolete strings are
automatically removed.

Adding a new language
---------------------

A new language can be added as following.

$ ./tools/update_translations -l nl_NL

Adding a new language to a plugin
---------------------------------

A new language can be added in the root plugin directory as following:

$ ./tools/update_translations -l nl_NL
