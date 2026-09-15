/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.mdm');

/**
 * @class Grommunio.plugins.mdm.MDM
 * @extends Grommunio.core.Plugin
 *
 * Plugin which lists all devices connected to a Grommunio account with Sync.
 * The user can wipe, resync, remove a device using buttons in grommunio Web.
 */
Grommunio.plugins.mdm.MDM = Ext.extend(Grommunio.core.Plugin, {
	/**
	 * Constructor
	 * @param {Object} config
	 * @protected
	 */
	constructor : function(config) {
		config = config || {};
		Grommunio.plugins.mdm.MDM.superclass.constructor.call(this, config);

		// Module information for MDM which will use in shadow store.
		Grommunio.core.ModuleNames["IPM.MDM"] = {
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
		Grommunio.core.data.SharedComponentType.addProperty('mdm.dialog.mdmdevicecontentpanel');
		Grommunio.core.data.SharedComponentType.addProperty('mdm.dialog.mdmmanagesharedfoldercontentpanel');
		Grommunio.plugins.mdm.MDM.superclass.initPlugin.apply(this, arguments);
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @returns {Number}
	 */
	bidSharedComponent : function (type, record)
	{
		var bid = -1;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['mdm.dialog.mdmdevicecontentpanel']:
			case Grommunio.core.data.SharedComponentType['mdm.dialog.mdmmanagesharedfoldercontentpanel']:
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
	 * @return {Grommunio.plugins.mdm.dialogs.MDMDeviceDetailsContentPanel} Component
	 */
	getSharedComponent : function (type, record)
	{
		var component;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['mdm.dialog.mdmdevicecontentpanel']:
				component = Grommunio.plugins.mdm.dialogs.MDMDeviceContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['mdm.dialog.mdmmanagesharedfoldercontentpanel']:
				component = Grommunio.plugins.mdm.dialogs.MDMManageSharedFolderContentPanel;
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
			xtype : 'Grommunio.plugins.mdm.mdmsettingscategory'
		}];
	},

	/**
	 * Creates a displayField that will show the version of the Grommunio Sync
	 */
	createVersionInfo : function() {
		var version = container.getSettingsModel().get('grommunio/v1/plugins/mdm/zpush-server-version', true);
		return {
			fieldLabel : _('grommunio-sync'),
			value : version
		};
	}

});

Grommunio.onReady(function() {
	container.registerPlugin(new Grommunio.core.PluginMetaData({
		name : 'mdm',
		displayName : _('Mobile device management'),
		pluginConstructor : Grommunio.plugins.mdm.MDM
	}));
});
