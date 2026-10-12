/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.settings');

/**
 * @class Grommunio.mail.settings.SettingsBlockedSendersWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingsblockedsenderswidget
 *
 * The {@link Grommunio.settings.ui.SettingsWidget widget} for configuring
 * the blocked senders list, backed by the Outlook-compatible FAI message.
 */
Grommunio.mail.settings.SettingsBlockedSendersWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Blocked Senders'),
			xtype: 'grommunio.settingsblockedsenderswidget',
			layout: 'anchor',
			items: [{
				xtype: 'displayfield',
				anchor: '100%',
				value: _('External content from blocked senders will always be blocked, even if the global block external content setting is disabled. Safe senders take priority over blocked senders.'),
				fieldClass: 'x-form-display-field grommunio-settings-widget-extrainfo'
			},{
				xtype: 'container',
				anchor: '100%',
				height: 32,
				layout: {
					type: 'hbox',
					align: 'middle',
					pack: 'start'
				},
				items: [{
					xtype: 'textfield',
					ref: '../addField',
					emptyText: _('user@domain or @domain'),
					flex: 1,
					listeners: {
						specialkey: this.onAddFieldKey,
						scope: this
					}
				},{
					xtype: 'spacer',
					width: 8
				},{
					xtype: 'button',
					text: _('Add'),
					handler: this.onAddEntry,
					width: 130,
					scope: this
				}]
			},{
				xtype: 'spacer',
				height: 8
			},{
				xtype: 'grommunio.safesendergrid',
				ref: 'blockedSendersGrid',
				anchor: '100%',
				height: 240,
				emptyText: _('Blocked Senders list is empty')
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
					handler: this.onDeleteEntry,
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

		Grommunio.mail.settings.SettingsBlockedSendersWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.mail.settings.SettingsBlockedSendersWidget.superclass.initEvents.call(this);

		this.mon(this.blockedSendersGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
		this.mon(this.blockedSendersGrid.getView(), 'refresh', this.onRefreshView, this);

		this.mon(this.blockedSendersGrid.getStore(), {
			'add': this.doStoreRemove,
			'remove': this.doStoreRemove,
			'clear': this.doStoreRemove,
			scope: this
		});

		// The lists may arrive after the category was opened.
		this.mon(Grommunio.mail.data.JunkMailStore, 'load', this.update, this);
	},

	/**
	 * @param {Ext.grid.View} gridView
	 */
	onRefreshView: function(gridView)
	{
		if (!Ext.isEmpty(this.blockedSendersGrid.getSafeSenders())) {
			this.blockedSendersGrid.getSelectionModel().selectFirstRow();
		}
		this.deleteAllButton.setDisabled(!gridView.hasRows());
	},

	/**
	 * @param {Ext.grid.RowSelectionModel} selectionModel
	 */
	onGridSelectionChange: function(selectionModel)
	{
		this.deleteButton.setDisabled(!selectionModel.hasSelection());
		this.deleteAllButton.setDisabled(!this.blockedSendersGrid.getView().hasRows());
	},

	/**
	 * Load blocked senders from JunkMailStore into the grid.
	 */
	update: function()
	{
		var entries = Grommunio.mail.data.JunkMailStore.getBlockedSenders();
		var data = {'item': []};
		Ext.each(entries, function(item, index) {
			data.item.push({name: item, id: index});
		});
		this.loadingView = true;
		this.blockedSendersGrid.getStore().loadData(data);
		this.loadingView = false;
	},

	/**
	 * Save blocked senders from the grid back to JunkMailStore.
	 */
	updateSettings: function()
	{
		if (Grommunio.mail.data.JunkMailStore.loaded) {
			Grommunio.mail.data.JunkMailStore.setBlockedSenders(this.blockedSendersGrid.getSafeSenders());
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
	onAddEntry: function()
	{
		if (this.blockedSendersGrid.addEntry(this.addField.getValue())) {
			this.addField.setValue('');
		} else {
			this.addField.markInvalid(_('Enter an email address or @domain'));
		}
	},

	/**
	 * @private
	 */
	onAddFieldKey: function(field, event)
	{
		if (event.getKey() === event.ENTER) {
			this.onAddEntry();
		}
	},

	/**
	 * @private
	 */
	onDeleteEntry: function()
	{
		this.blockedSendersGrid.deleteSafeSender();
	},

	/**
	 * @private
	 */
	onDeleteAll: function()
	{
		this.blockedSendersGrid.deleteAllSafeSender();
	}
});

Ext.reg('grommunio.settingsblockedsenderswidget', Grommunio.mail.settings.SettingsBlockedSendersWidget);
