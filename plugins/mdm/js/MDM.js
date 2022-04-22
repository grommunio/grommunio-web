Ext.namespace('Zarafa.plugins.mdm');

/**
 * @class Zarafa.plugins.mdm.MDM
 * @extends Zarafa.core.Plugin
 *
 * Plugin which lists all devices connected to a Grommunio account with Sync.
 * The user can wipe, resync, remove a device using buttons in the WebApp.
 */
Zarafa.plugins.mdm.MDM = Ext.extend(Zarafa.core.Plugin, {
	/**
	 * Constructor
	 * @param {Object} config
	 * @protected
	 */
	constructor : function(config) {
		config = config || {};
		Zarafa.plugins.mdm.MDM.superclass.constructor.call(this, config);

		// Module information for MDM which will use in shadow store.
		Zarafa.core.ModuleNames["IPM.MDM"] = {
			list: 'pluginmdmmodule',
			item: 'pluginmdmmodule'
		}
	},

	/**
	 * Called after constructor.
	 * Registers insertion points.
	 * @protected
	 */
	initPlugin : function()
	{
		this.registerInsertionPoint('context.settings.categories', this.createSettingCategory, this);
		// this.registerInsertionPoint('settings.versioninformation', this.createVersionInfo, this);
		Zarafa.core.data.SharedComponentType.addProperty('mdm.dialog.mdmdevicecontentpanel');
		Zarafa.core.data.SharedComponentType.addProperty('mdm.dialog.mdmmanagesharedfoldercontentpanel');
		Zarafa.plugins.mdm.MDM.superclass.initPlugin.apply(this, arguments);
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @returns {Number}
	 */
	bidSharedComponent : function (type, record)
	{
		var bid = -1;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['mdm.dialog.mdmdevicecontentpanel']:
			case Zarafa.core.data.SharedComponentType['mdm.dialog.mdmmanagesharedfoldercontentpanel']:
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
	 * @return {Zarafa.plugins.mdm.dialogs.MDMDeviceDetailsContentPanel} Component
	 */
	getSharedComponent : function (type, record)
	{
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['mdm.dialog.mdmdevicecontentpanel']:
				component = Zarafa.plugins.mdm.dialogs.MDMDeviceContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['mdm.dialog.mdmmanagesharedfoldercontentpanel']:
				component = Zarafa.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel;
				break;
		}
		return component;
	},


	/**
	 * Creates a category in settings for Grommunio Sync
	 * @return {mdmsettingscategory}
	 */
	createSettingCategory: function() {
		return [{
			xtype : 'Zarafa.plugins.mdm.mdmsettingscategory'
		}];
	},

	/**
	 * Creates a displayField that will show the version of the Grommunio Sync
	 */
	createVersionInfo : function() {
		var version = container.getSettingsModel().get('zarafa/v1/plugins/mdm/zpush-server-version', true);
		return {
			fieldLabel : _('grommunio-sync'),
			value : version
		};
	}
        
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'mdm',
		displayName : _('Mobile device management'),
		pluginConstructor : Zarafa.plugins.mdm.MDM
	}));
});
