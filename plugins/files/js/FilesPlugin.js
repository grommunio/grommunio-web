Ext.namespace('Grommunio.plugins.files');

/**
 * @class Grommunio.plugins.files.FilesPlugin
 * @extends Grommunio.core.Plugin
 *
 * This class integrates the Files plugin into grommunio Web.
 * It allows users to set up and manage their Files accounts.
 */
Grommunio.plugins.files.FilesPlugin = Ext.extend(Grommunio.core.Plugin, {

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config) {
		config = config || {};

		this.registerModules();

		Grommunio.plugins.files.FilesPlugin.superclass.constructor.call(this, config);
	},

	/**
	 * This method is called by the parent and will initialize all insertion points
	 * and shared components.
	 */
	initPlugin: function () {
		Grommunio.plugins.files.FilesPlugin.superclass.initPlugin.apply(this, arguments);

		// FIXME: Check we need this?
		Grommunio.core.mapi.IconIndex.addProperty("files");

		Grommunio.core.mapi.IconIndex["folder_note"] = 5378;
		Grommunio.core.mapi.IconIndex["files"] = 5377;

		Grommunio.core.data.SharedComponentType.addProperty('plugins.files.onlyofficepanel');

		Grommunio.core.data.SharedComponentType.addProperty('filesplugin.accountedit');
		Grommunio.core.data.SharedComponentType.addProperty('filesplugin.documentpreview');
		Grommunio.core.data.SharedComponentType.addProperty('filesplugin.featurequotainfo');
		Grommunio.core.data.SharedComponentType.addProperty('filesplugin.featureversioninfo');
		Grommunio.core.data.SharedComponentType.addProperty('common.dialog.attachments.savetofiles');
	},

	/**
	 * This method registers the Files module names to grommunio Web.
	 */
	registerModules: function () {
		Grommunio.core.ModuleNames['IPM.FILESACCOUNT'] = {
			list: 'filesaccountmodule',
			item: 'filesaccountmodule'
		};
	},

	/**
	 * Bid for the type of shared component and the given record.
	 *
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @returns {Number}
	 */
	bidSharedComponent: function (type, record) {
		var bid = -1;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['filesplugin.accountedit']:
			case Grommunio.core.data.SharedComponentType['filesplugin.featurequotainfo']:
			case Grommunio.core.data.SharedComponentType['filesplugin.featureversioninfo']:
			case Grommunio.core.data.SharedComponentType['common.dialog.attachments.savetofiles']:
			case Grommunio.core.data.SharedComponentType['plugins.files.onlyofficepanel']:
			case Grommunio.core.data.SharedComponentType['filesplugin.documentpreview']:
				bid = 1;
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 *
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function (type, record) {
		var component;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['filesplugin.accountedit']:
				component = Grommunio.plugins.files.settings.ui.AccountEditContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['filesplugin.featurequotainfo']:
				component = Grommunio.plugins.files.settings.ui.FeatureQuotaInfoContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['filesplugin.featureversioninfo']:
				component = Grommunio.plugins.files.settings.ui.FeatureVersionInfoContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['plugins.files.onlyofficepanel']:
				component = Grommunio.plugins.files.ui.ContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['filesplugin.documentpreview']:
				// A file is previewed by the same viewer that shows an
				// attachment of a mail.
				component = Grommunio.common.previewer.ui.ViewerContainer;
				break;
		}

		return component;
	}
});

/**
 * This code gets executed after grommunio Web has loaded.
 * It hooks the plugin to grommunio Web.
 */
Grommunio.onReady(function () {
	container.registerPlugin(new Grommunio.core.PluginMetaData({
		name             : 'files',
		displayName      : _('Files Plugin'),
		about            : Grommunio.plugins.files.ABOUT,
		allowUserDisable : true,
		pluginConstructor: Grommunio.plugins.files.FilesPlugin
	}));
});
