Ext.namespace('Zarafa.plugins.files.backend.Seafile');

/**
 * Entry point used to register the Seafile backend with the Files plugin.
 * Mirrors the approach taken by the other bundled backends so the plugin
 * manager can construct all required UI components on demand.
 *
 * @class Zarafa.plugins.files.backend.Seafile.SeafileBackend
 * @extends Zarafa.core.Plugin
 */
Zarafa.plugins.files.backend.Seafile.SeafileBackend = Ext.extend(
	Zarafa.core.Plugin,
	{
		/**
		 * Initialise the plugin with sane defaults and register for upcoming hooks.
		 *
		 * @param {Object} config Optional configuration object provided by the container.
		 */
		constructor: function (config) {
			config = config || {};
			Zarafa.plugins.files.backend.Seafile.SeafileBackend.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Register all Ext insertion points and shared components consumed by this backend.
		 */
		initPlugin: function () {
			Zarafa.plugins.files.backend.Seafile.SeafileBackend.superclass.initPlugin.apply(
				this,
				arguments,
			);
			this.registerInsertionPoint(
				'plugin.files.sharedialog',
				this.createShareDialogInsertionPoint,
				this,
			);
			Zarafa.core.data.SharedComponentType.addProperty(
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
				case Zarafa.core.data.SharedComponentType[
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
				case Zarafa.core.data.SharedComponentType[
					'filesplugin.seafile.useredit'
				]:
					i =
						Zarafa.plugins.files.backend.Seafile.ui
							.FilesShareUserEditContentPanel;
			}
			return i;
		},
	},
);
Zarafa.onReady(function () {
	container.registerPlugin(
		new Zarafa.core.PluginMetaData({
			name: 'filesbackendSeafile',
			displayName: _('Files: Seafile Backend'),
			allowUserDisable: false,
			pluginConstructor: Zarafa.plugins.files.backend.Seafile.SeafileBackend,
		}),
	);
});
