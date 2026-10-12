/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.settings');

/**
 * @class Grommunio.mail.settings.SettingsSafeSendersWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingssafesenderswidget
 *
 * The {@link Grommunio.settings.ui.SettingsWidget widget} for configuring
 * the safe senders list, backed by the Outlook-compatible FAI message.
 */
Grommunio.mail.settings.SettingsSafeSendersWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Safe Senders'),
			cls: 'grommunio-settings-widget',
			xtype: 'grommunio.settingssafesenderswidget',
			layout: 'anchor',
			items: [{
				xtype: 'displayfield',
				anchor: '100%',
				value: _('To protect your privacy email addresses or domains can only be added via the "Add to safe sender list" functionality in an opened email.'),
				fieldClass: 'x-form-display-field grommunio-settings-widget-extrainfo'
			},{
				xtype: 'spacer',
				height: 8
			},{
				xtype: 'grommunio.safesendergrid',
				ref: 'safeSendersGrid',
				anchor: '100%',
				height: 240,
				emptyText: _('Safe Senders list is empty')
			},{
				xtype: 'container',
				anchor: '100%',
				height: 40,
				layout: {
					type: 'hbox',
					align: 'middle',
					pack: 'end'
				},
				defaults: {
					xtype: 'button',
					width: 130,
					disabled: true,
					scope: this
				},
				items: [{
					text: _('Delete'),
					handler: this.onDeleteSafeSender,
					ref: '../deleteButton'
				},{
					xtype: 'spacer',
					width: 8
				},{
					text: _('Delete all'),
					handler: this.onDeleteAll,
					ref: '../deleteAllButton'
				}]
			}]
		});

		Grommunio.mail.settings.SettingsSafeSendersWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize events for the widget.
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.mail.settings.SettingsSafeSendersWidget.superclass.initEvents.call(this);

		this.mon(this.safeSendersGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
		this.mon(this.safeSendersGrid.getView(), 'refresh', this.onRefreshView, this);

		this.mon(this.getStore(), {
			'remove': this.doStoreRemove,
			'clear': this.doStoreRemove,
			scope: this
		});

		// The lists may arrive after the category was opened.
		this.mon(Grommunio.mail.data.JunkMailStore, 'load', this.update, this);
	},

	/**
	 * Event handler for grid view refresh.
	 * @param {Ext.grid.View} gridView that fired the event
	 */
	onRefreshView: function(gridView)
	{
		if (!Ext.isEmpty(this.safeSendersGrid.getSafeSenders())) {
			this.safeSendersGrid.getSelectionModel().selectFirstRow();
		}
		this.deleteAllButton.setDisabled(!gridView.hasRows());
	},

	/**
	 * @return {Ext.data.JsonStore} The store associated with the grid.
	 */
	getStore: function()
	{
		return this.safeSendersGrid.getStore();
	},

	/**
	 * Event handler for grid selection change.
	 * @param {Ext.grid.RowSelectionModel} selectionModel
	 */
	onGridSelectionChange: function(selectionModel)
	{
		this.deleteButton.setDisabled(!selectionModel.hasSelection());
		this.deleteAllButton.setDisabled(!this.safeSendersGrid.getView().hasRows());
	},

	/**
	 * Load safe senders from JunkMailStore into the grid.
	 */
	update: function()
	{
		var entries = Grommunio.mail.data.JunkMailStore.getSafeSenders();
		var data = {'item': []};
		Ext.each(entries, function(item, index) {
			data.item.push({name: item, id: index});
		});
		this.loadingView = true;
		this.getStore().loadData(data);
		this.loadingView = false;
	},

	/**
	 * Save safe senders from the grid back to JunkMailStore.
	 */
	updateSettings: function()
	{
		if (Grommunio.mail.data.JunkMailStore.loaded) {
			Grommunio.mail.data.JunkMailStore.setSafeSenders(this.safeSendersGrid.getSafeSenders());
		}
	},

	/**
	 * @private
	 */
	doStoreRemove: function()
	{
		// Rendering the loaded lists is not a user change.
		if (!this.loadingView) {
			this.settingsContext.getModel().setDirty();
		}
	},

	/**
	 * @private
	 */
	onDeleteSafeSender: function()
	{
		this.safeSendersGrid.deleteSafeSender();
	},

	/**
	 * @private
	 */
	onDeleteAll: function()
	{
		this.safeSendersGrid.deleteAllSafeSender();
	}
});

Ext.reg('grommunio.settingssafesenderswidget', Grommunio.mail.settings.SettingsSafeSendersWidget);
