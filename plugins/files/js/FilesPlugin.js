Ext.namespace('Zarafa.plugins.files');

/**
 * @class Zarafa.plugins.files.FilesPlugin
 * @extends Zarafa.core.Plugin
 *
 * This class integrates the Files plugin to the core WebApp.
 * It allows users to set up and manage their Files accounts.
 */
Zarafa.plugins.files.FilesPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config) {
		config = config || {};

		this.registerModules();

		Zarafa.plugins.files.FilesPlugin.superclass.constructor.call(this, config);
	},

	/**
	 * This method is called by the parent and will initialize all insertion points
	 * and shared components.
	 */
	initPlugin: function () {
		Zarafa.plugins.files.FilesPlugin.superclass.initPlugin.apply(this, arguments);

		// FIXME: Check we need this?
		Zarafa.core.mapi.IconIndex.addProperty("files");

		Zarafa.core.mapi.IconIndex["folder_note"] = 5378;
		Zarafa.core.mapi.IconIndex["files"] = 5377;

		Zarafa.core.data.SharedComponentType.addProperty('filesplugin.accountedit');
		Zarafa.core.data.SharedComponentType.addProperty('filesplugin.featurequotainfo');
		Zarafa.core.data.SharedComponentType.addProperty('filesplugin.featureversioninfo');
		Zarafa.core.data.SharedComponentType.addProperty('common.dialog.attachments.savetofiles');
	},

	/**
	 * This method registers the Files module names to the main WebApp.
	 */
	registerModules: function () {
		Zarafa.core.ModuleNames['IPM.FILESACCOUNT'] = {
			list: 'filesaccountmodule',
			item: 'filesaccountmodule'
		}
	},

	/**
	 * Bid for the type of shared component and the given record.
	 *
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @returns {Number}
	 */
	bidSharedComponent: function (type, record) {
		var bid = -1;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['filesplugin.accountedit']:
			case Zarafa.core.data.SharedComponentType['filesplugin.featurequotainfo']:
			case Zarafa.core.data.SharedComponentType['filesplugin.featureversioninfo']:
			case Zarafa.core.data.SharedComponentType['common.dialog.attachments.savetofiles']:
				bid = 1;
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 *
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function (type, record) {
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['filesplugin.accountedit']:
				component = Zarafa.plugins.files.settings.ui.AccountEditContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['filesplugin.featurequotainfo']:
				component = Zarafa.plugins.files.settings.ui.FeatureQuotaInfoContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['filesplugin.featureversioninfo']:
				component = Zarafa.plugins.files.settings.ui.FeatureVersionInfoContentPanel;
				break;
		}

		return component;
	}
});

/**
 * This code gets executed after the WebApp has loaded.
 * It hooks the plugin to the WebApp.
 */
Zarafa.onReady(function () {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name             : 'files',
		displayName      : dgettext('plugin_files', 'Files Plugin'),
		about            : Zarafa.plugins.files.ABOUT,
		allowUserDisable : true,
		pluginConstructor: Zarafa.plugins.files.FilesPlugin
	}));
});
