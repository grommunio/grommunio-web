=============================================
Migrating a plugin to the grommunio namespace
=============================================

grommunio Web 5.0 retires the ``Zarafa`` identifiers the code base inherited
from its WebApp origins. A plugin written for an earlier release has to be
renamed once; this page lists what changed and what still works in the
meantime.

What changed
============

.. list-table::
   :header-rows: 1
   :widths: 30 35 35

   * - Where
     - Before
     - grommunio Web 5.0
   * - JavaScript namespace
     - ``Zarafa.core.Plugin``, ``Zarafa.common.Actions``, …
     - ``Grommunio.core.Plugin``, ``Grommunio.common.Actions``, …
   * - Component xtypes and ptypes
     - ``zarafa.recipientfield``, ``zarafa.combolistautowidth``
     - ``grommunio.recipientfield``, ``grommunio.combolistautowidth``
   * - CSS classes
     - ``zarafa-mainpanel``, ``x-zarafa-boxfield``, ``zarafa-action``
     - ``grommunio-mainpanel``, ``x-grommunio-boxfield``, ``grommunio-action``
   * - Settings tree
     - ``zarafa/v1/plugins/<name>/…``
     - ``grommunio/v1/plugins/<name>/…``
   * - Source tree of the core client
     - ``client/zarafa/``
     - ``client/grommunio/``
   * - JSON request envelope
     - ``{"zarafa": {…}}``
     - ``{"grommunio": {…}}``
   * - PHP
     - ``ZarafaException``, ``ZarafaErrorException``, ``ERROR_ZARAFA``
     - ``GrommunioException``, ``GrommunioErrorException``, ``ERROR_GROMMUNIO``
   * - Build
     - terser reserves the global ``Zarafa``
     - terser reserves the global ``Grommunio``

Stored user settings are moved from ``zarafa/v1`` to ``grommunio/v1`` the
first time a store is opened by 5.0, so a plugin finds its settings under the
new path without doing anything. Persisted component state keeps its keys
because ``Ext.Component#getStateName`` strips the new prefix the same way it
stripped the old one, and keeps stripping ``zarafa.`` for components a plugin
has not renamed yet.

Not renamed, because they belong to other components: the php_mapi functions
``mapi_logon_zarafa``, ``mapi_zarafa_getpermissionrules`` and
``mapi_zarafa_setpermissionrules``, the ``ZARAFA_*_GUID`` store provider
constants from mapi-header-php, and the address type ``ZARAFA`` gromox
reports for internal recipients.

Renaming a plugin
=================

A mechanical replacement covers almost everything:

.. code-block:: sh

	git grep -l -i zarafa -- . ':!*/vendor/*' \
	  | xargs perl -pi -e 's/Zarafa/Grommunio/g; s/zarafa/grommunio/g; s/ZARAFA/GROMMUNIO/g'

Check the result for the three groups above that must keep their name, and for
string literals that reach the server or the user: ``'ZARAFA'`` compared
against ``address_type`` stays, a CSS class in a ``cls`` config follows the
style sheet that defines it, and nothing in a ``.po`` catalogue needs to
change. Build the plugin again; ``plugins/shared.mk`` already reserves the
new global.

Deprecated aliases
==================

To give the ecosystem one release to move, 5.0 keeps the old names reachable:

* ``window.Zarafa`` resolves to ``Grommunio`` and logs a deprecation warning
  to the browser console the first time it is read.
* An xtype or ptype starting with ``zarafa.`` that no component registered
  under that name falls through to its ``grommunio.`` counterpart in
  ``Ext.ComponentMgr.create`` and ``createPlugin``.
* A settings path starting with ``zarafa/`` is read and written under
  ``grommunio/`` by the client ``SettingsModel`` and the server ``Settings``
  class.
* PHP keeps ``ZarafaException``, ``ZarafaErrorException`` and ``ERROR_ZARAFA``
  as aliases of the new names.

CSS classes are not aliased. A plugin style sheet that selects on
``zarafa-*`` or ``x-zarafa-*`` classes has to be renamed to keep its effect.
``Ext.Component#isXType('zarafa.…')`` returns ``false`` for renamed core
components; compare against the new xtype.

The aliases are scheduled to go away with the next major release. A plugin
that still triggers the console warning after the rename has a reference left
to fix.
