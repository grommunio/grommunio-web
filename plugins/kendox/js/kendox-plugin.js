/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace("Grommunio.plugins.kendox");

/**
 * @class Grommunio.plugins.kendox.KendoxPlugin
 * @extends Grommunio.core.Plugin
 */
Grommunio.plugins.kendox.KendoxPlugin = Ext.extend(Grommunio.core.Plugin, {
	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config) {
		config = config || {};
		Grommunio.plugins.kendox.KendoxPlugin.superclass.constructor.call(
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
		Grommunio.core.data.SharedComponentType.addProperty("kendox.dialog.upload");
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @returns {Number}
	 */
	bidSharedComponent: function (type, record) {
		var bid = -1;
		switch (type) {
			case Grommunio.core.data.SharedComponentType["kendox.dialog.upload"]:
				bid = 1;
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @return {Grommunio.plugins.mdm.dialogs.MDMDeviceDetailsContentPanel} Component
	 */
	getSharedComponent: function (type) {
		var component;
		switch (type) {
			case Grommunio.core.data.SharedComponentType["kendox.dialog.upload"]:
				component = Grommunio.plugins.kendox.UploadDialog;
				break;
		}
		return component;
	},

	/**
	 * Return the instance of {@link Grommunio.plugins.desktopnotifications.js.settings.SettingsDesktopNotificationsCategory SettingsDesktopNotificationsCategory}.
	 *
	 * @return {Grommunio.plugins.desktopnotifications.js.settings.SettingsDesktopNotificationsCategory} An instance of the settings category
	 * @private
	 */
	createSettingsCategory: function () {
		return {
			xtype: "grommunio.kendoxsettingscategory",
			plugin: this,
		};
	},

	addArchiveAction: function () {
		return {
			xtype: "grommunio.conditionalitem",
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
		Grommunio.core.data.UIFactory.openLayerComponent(
			Grommunio.core.data.SharedComponentType["kendox.dialog.upload"],
			undefined,
			config,
		);
	},
});

Grommunio.onReady(function () {
	container.registerPlugin(
		new Grommunio.core.PluginMetaData({
			name: "kendox",
			displayName: _("Kendox InfoShare") + " plugin",
			about: Grommunio.plugins.kendox.ABOUT,
			pluginConstructor: Grommunio.plugins.kendox.KendoxPlugin,
		}),
	);
});
