/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.backend.Seafile');

/**
 * Entry point used to register the Seafile backend with the Files plugin.
 * Mirrors the approach taken by the other bundled backends so the plugin
 * manager can construct all required UI components on demand.
 *
 * @class Grommunio.plugins.files.backend.Seafile.SeafileBackend
 * @extends Grommunio.core.Plugin
 */
Grommunio.plugins.files.backend.Seafile.SeafileBackend = Ext.extend(
	Grommunio.core.Plugin,
	{
		/**
		 * Initialise the plugin with sane defaults and register for upcoming hooks.
		 *
		 * @param {Object} config Optional configuration object provided by the container.
		 */
		constructor: function (config) {
			config = config || {};
			Grommunio.plugins.files.backend.Seafile.SeafileBackend.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Register all Ext insertion points and shared components consumed by this backend.
		 */
		initPlugin: function () {
			Grommunio.plugins.files.backend.Seafile.SeafileBackend.superclass.initPlugin.apply(
				this,
				arguments,
			);
			this.registerInsertionPoint(
				'plugin.files.sharedialog',
				this.createShareDialogInsertionPoint,
				this,
			);
			Grommunio.core.data.SharedComponentType.addProperty(
				'filesplugin.seafile.useredit',
			);
		},

		/**
		 * Provide the configuration used to render the share dialog when requested by the Files module.
		 *
		 * @return {{xtype: string}}
		 */
		createShareDialogInsertionPoint: function () {
			return {
				xtype: 'filesplugin.seafile.filessharedialogpanel',
			};
		},

		/**
		 * Binds component requests to the Seafile specific user edit panel.
		 *
		 * @param {Number} componentType Component type requested by the container.
		 * @return {Number}
		 */
		bidSharedComponent: function (componentType) {
			var i = -1;
			switch (componentType) {
				case Grommunio.core.data.SharedComponentType[
					'filesplugin.seafile.useredit'
				]:
					i = 1;
			}
			return i;
		},

		/**
		 * Returns the concrete implementation for Seafile specific shared components.
		 *
		 * @param {Number} componentType Component type requested by the container.
		 * @return {Function|undefined}
		 */
		getSharedComponent: function (componentType) {
			var i;
			switch (componentType) {
				case Grommunio.core.data.SharedComponentType[
					'filesplugin.seafile.useredit'
				]:
					i =
						Grommunio.plugins.files.backend.Seafile.ui
							.FilesShareUserEditContentPanel;
			}
			return i;
		},
	},
);
Grommunio.onReady(function () {
	container.registerPlugin(
		new Grommunio.core.PluginMetaData({
			name: 'filesbackendSeafile',
			displayName: _('Files: Seafile Backend'),
			allowUserDisable: false,
			pluginConstructor: Grommunio.plugins.files.backend.Seafile.SeafileBackend,
		}),
	);
});
