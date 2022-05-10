Ext.namespace('Zarafa.plugins.files.backend.Owncloud');

/**
 *
 * @class Zarafa.plugins.files.backend.Owncloud.OwncloudBackend
 * @extends Zarafa.core.Plugin
 *
 * Plugin for the Owncloud backend. It requires the main files plugin.
 */
Zarafa.plugins.files.backend.Owncloud.OwncloudBackend = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Constructor
	 * @protected
	 */
	constructor: function (config) {
		config = config || {};

		Zarafa.plugins.files.backend.Owncloud.OwncloudBackend.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize all insertion points.
	 */
	initPlugin: function () {
		Zarafa.plugins.files.backend.Owncloud.OwncloudBackend.superclass.initPlugin.apply(this, arguments);

		this.registerInsertionPoint('plugin.files.sharedialog', this.createShareDialogInsertionPoint, this);

		// Register common specific dialog types
		Zarafa.core.data.SharedComponentType.addProperty('filesplugin.owncloud.useredit');
	},

	/**
	 * Callback for the plugin.files.sharedialog insertion point.
	 *
	 * @return {{xtype: string}}
	 */
	createShareDialogInsertionPoint: function () {
		return {
			xtype: 'filesplugin.owncloud.filessharedialogpanel'
		};
	},

	/**
	 * Bid for the type of shared component
	 * and the given record.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function (type, record) {
		var bid = -1;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['filesplugin.owncloud.useredit']:
				bid = 1;
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function (type, record) {
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['filesplugin.owncloud.useredit']:
				component = Zarafa.plugins.files.backend.Owncloud.ui.FilesShareUserEditContentPanel;
				break;
		}

		return component;
	}
});

// Register plugin
Zarafa.onReady(function () {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name             : 'filesbackendOwncloud', // this name must be in format "filesbackend<Backendname>"
		displayName      : _('Files: ownCloud Backend'),
		allowUserDisable : false, // don't allow to disable this plugin - files will get confused if it is disabled
		pluginConstructor: Zarafa.plugins.files.backend.Owncloud.OwncloudBackend
	}));
});
