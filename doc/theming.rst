=======
Theming
=======

A theme is a plugin directory holding a ``theme.json`` file. grommunio Web reads
it, turns it into CSS and applies it to the login screen and to the application.
A user picks a theme in *Settings*; an administrator can set one for everybody
with ``define("THEME", 'mytheme')`` in ``config.php``.

Layout
======

.. code-block:: text

	plugins/mytheme/
		manifest.xml        plugin manifest, as for any other plugin
		theme.json          the theme
		favicon.ico         optional, replaces the icon of the browser tab
		img/…               images the theme refers to
		css/…               style sheets the theme refers to

Paths inside ``theme.json`` are relative to the theme directory. An absolute
``http://`` or ``https://`` URL is taken as it is. Every generated URL gets a
cache buster, so replacing an image is enough to make browsers fetch it again.

A minimal theme
===============

.. code-block:: json

	{
		"id": "mytheme",
		"display-name": "My company",
		"primary-color": "#b8005e"
	}

``primary-color`` alone themes the whole interface: the top menu bar, buttons,
selection, links, focus rings and the accents throughout the application. The
shades that go with it are derived unless the theme names them.

Keys
====

Colors
------

Any CSS color notation is accepted and normalised to hex.

``primary-color``
	The color of the interface. Everything below is derived from it.

``primary-color:hover``
	Hover and active state of the primary color. Derived by darkening
	``primary-color``, or lightening it when it is nearly black.

``primary-color:dark``
	The deeper shade used for borders and emphasis. Derived by darkening
	``primary-color``.

``gradient-start``, ``gradient-end``
	The top menu bar is a flat ``primary-color`` by default. Set both to paint
	it as a gradient instead.

``mainbar-text-color``
	Text in the top menu bar. Defaults to white, or black when
	``primary-color`` is too light for white text.

``action-color``, ``action-color:hover``
	Elements that call for attention: primary buttons, today in the calendar.

``selection-color``, ``selection-text-color``
	Background and text of selected rows. Derived from ``primary-color``.

``focus-color``
	The outline of the focused element.

Images
------

``logo-large``
	The logo on the login and welcome screen, at most 220x60 px.

``logo-small``
	The logo shown on the right of the toolbar below the top menu bar, at most
	45 px high. Falls back to ``logo-large``.

``logo-small:dark``
	The same logo for dark mode. The toolbar is a light surface in light mode
	and a dark one in dark mode, so a logo with a fixed ink usually needs two
	files. Falls back to ``logo-small``.

``background-image``
	The background of the login and welcome screen.

``spinner-image``
	The busy indicator, on the login screen and everywhere in the application.

``favicon.ico``
	Not a key: a file of that name next to ``theme.json`` replaces the icon of
	the browser tab and of desktop notifications.

Style sheets
------------

``stylesheets``
	One path, or a list of paths, to style sheets loaded after everything the
	theme generates. Use this for anything the keys above do not cover.

Going further than the keys
===========================

grommunio Web is built on CSS custom properties, and a theme sets them from the
keys above. A style sheet listed under ``stylesheets`` can set any of them
directly, which reaches every place the interface uses them:

.. code-block:: css

	body {
		--theme-primary-color: #b8005e;
		--theme-primary-hover: #850043;
		--theme-primary-dark: #510029;
		--theme-gradient-start: #b8005e;
		--theme-gradient-end: #85004a;
		--theme-spinner-image: url(../img/spinner.svg);
	}

Dark mode derives its own palette from these, so a theme does not have to
provide a second set of colors.

A complete example
==================

.. code-block:: json

	{
		"id": "mytheme",
		"display-name": "My company",
		"primary-color": "#b8005e",
		"action-color": "#00838f",
		"logo-large": "img/logo-large.svg",
		"logo-small": "img/logo-small.svg",
		"logo-small:dark": "img/logo-small-light.svg",
		"background-image": "img/login.jpg",
		"spinner-image": "img/spinner.svg",
		"stylesheets": "css/mytheme.css"
	}

Checking a theme
================

A theme that does not appear in *Settings* usually has a ``theme.json`` that is
not valid JSON; the reason is written to the web server's error log. To see
what a theme generates, look at the ``<style>`` block in the page source of the
login screen — it carries every rule the theme produces.
