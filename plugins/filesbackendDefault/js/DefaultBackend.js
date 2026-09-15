Ext.namespace('Grommunio.plugins.files.backend.Default');

/**
 *
 * @class Grommunio.plugins.files.backend.Default.DefaultBackend
 * @extends Grommunio.core.Plugin
 *
 * Plugin for the default WebDAV backend. It requires the main files plugin.
 */
Grommunio.plugins.files.backend.Default.DefaultBackend = Ext.extend(
	Grommunio.core.Plugin,
	{
		/**
		 * Constructor
		 * @protected
		 */
		constructor: function (config) {
			config = config || {};

			Grommunio.plugins.files.backend.Default.DefaultBackend.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Initialize all insertion points.
		 */
		initPlugin: function () {
			Grommunio.plugins.files.backend.Default.DefaultBackend.superclass.initPlugin.apply(
				this,
				arguments,
			);

			this.registerInsertionPoint(
				'plugin.files.sharedialog',
				this.createShareDialogInsertionPoint,
				this,
			);

			// Register common specific dialog types
			Grommunio.core.data.SharedComponentType.addProperty(
				'filesplugin.default.useredit',
			);
		},

		/**
		 * Callback for the plugin.files.sharedialog insertion point.
		 *
		 * @return {{xtype: string}}
		 */
		createShareDialogInsertionPoint: function () {
			return {
				xtype: 'filesplugin.default.filessharedialogpanel',
			};
		},

		/**
		 * Bid for the type of shared component
		 * and the given record.
		 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
		 * @param {Ext.data.Record} record Optionally passed record.
		 * @return {Number} The bid for the shared component
		 */
		bidSharedComponent: function (type, record) {
			var bid = -1;
			switch (type) {
				case Grommunio.core.data.SharedComponentType[
					'filesplugin.default.useredit'
				]:
					bid = 1;
					break;
			}
			return bid;
		},

		/**
		 * Will return the reference to the shared component.
		 * Based on the type of component requested a component is returned.
		 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
		 * @param {Ext.data.Record} record Optionally passed record.
		 * @return {Ext.Component} Component
		 */
		getSharedComponent: function (type, record) {
			var component;
			switch (type) {
				case Grommunio.core.data.SharedComponentType[
					'filesplugin.default.useredit'
				]:
					component =
						Grommunio.plugins.files.backend.Default.ui
							.FilesShareUserEditContentPanel;
					break;
			}

			return component;
		},
	},
);

// Register plugin
Grommunio.onReady(function () {
	container.registerPlugin(
		new Grommunio.core.PluginMetaData({
			name: 'filesbackendDefault', // this name must be in format "filesbackend<Backendname>"
			displayName: _('Files: Default plugin'),
			allowUserDisable: false, // don't allow to disable this plugin - files will get confused if it is disabled
			pluginConstructor: Grommunio.plugins.files.backend.Default.DefaultBackend,
		}),
	);
});
