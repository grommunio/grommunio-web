Ext.namespace("Zarafa.plugins.kendox");

/**
 * @class Zarafa.plugins.kendox.KendoxPlugin
 * @extends Zarafa.core.Plugin
 */
Zarafa.plugins.kendox.KendoxPlugin = Ext.extend(Zarafa.core.Plugin, {
	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config) {
		config = config || {};
		Zarafa.plugins.kendox.KendoxPlugin.superclass.constructor.call(
			this,
			config,
		);
	},

	/**
	 * This method is called by the parent and will initialize all insertion points
	 * and shared components.
	 */
	initPlugin: function () {
		this.registerInsertionPoint(
			"context.settings.categories",
			this.createSettingsCategory,
			this,
		);
		this.registerInsertionPoint(
			"context.mail.contextmenu.actions",
			this.addArchiveAction,
			this,
		);
		Zarafa.core.data.SharedComponentType.addProperty("kendox.dialog.upload");
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @returns {Number}
	 */
	bidSharedComponent: function (type, record) {
		var bid = -1;
		switch (type) {
			case Zarafa.core.data.SharedComponentType["kendox.dialog.upload"]:
				bid = 1;
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @return {Zarafa.plugins.mdm.dialogs.MDMDeviceDetailsContentPanel} Component
	 */
	getSharedComponent: function (type) {
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType["kendox.dialog.upload"]:
				component = Zarafa.plugins.kendox.UploadDialog;
				break;
		}
		return component;
	},

	/**
	 * Return the instance of {@link Zarafa.plugins.desktopnotifications.js.settings.SettingsDesktopNotificationsCategory SettingsDesktopNotificationsCategory}.
	 *
	 * @return {Zarafa.plugins.desktopnotifications.js.settings.SettingsDesktopNotificationsCategory} An instance of the settings category
	 * @private
	 */
	createSettingsCategory: function () {
		return {
			xtype: "zarafa.kendoxsettingscategory",
			plugin: this,
		};
	},

	addArchiveAction: function () {
		return {
			xtype: "zarafa.conditionalitem",
			text: _("Archive to InfoShare") + "...",
			iconCls: "icon_kendox_upload",
			handler: this.openUploadDialog,
			scope: this,
		};
	},

	openUploadDialog: function (item) {
		var config = {
			modal: true,
			records: item.parentMenu.records,
		};
		Zarafa.core.data.UIFactory.openLayerComponent(
			Zarafa.core.data.SharedComponentType["kendox.dialog.upload"],
			undefined,
			config,
		);
	},
});

Zarafa.onReady(function () {
	container.registerPlugin(
		new Zarafa.core.PluginMetaData({
			name: "kendox",
			displayName: _("Kendox InfoShare") + " plugin",
			about: Zarafa.plugins.kendox.ABOUT,
			pluginConstructor: Zarafa.plugins.kendox.KendoxPlugin,
		}),
	);
});
