/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.settings');

/**
 * @class Grommunio.mail.settings.SettingsSafeRecipientsWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingssaferecipientswidget
 *
 * The {@link Grommunio.settings.ui.SettingsWidget widget} for configuring
 * the safe recipients list, backed by the Outlook-compatible FAI message.
 */
Grommunio.mail.settings.SettingsSafeRecipientsWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Safe Recipients'),
			xtype: 'grommunio.settingssaferecipientswidget',
			layout: 'anchor',
			items: [{
				xtype: 'displayfield',
				anchor: '100%',
				value: _('Mailing lists or distribution lists that you have added to the Safe Recipients List are considered trustworthy.'),
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
				ref: 'safeRecipientsGrid',
				anchor: '100%',
				height: 240,
				emptyText: _('Safe Recipients list is empty')
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

		Grommunio.mail.settings.SettingsSafeRecipientsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.mail.settings.SettingsSafeRecipientsWidget.superclass.initEvents.call(this);

		this.mon(this.safeRecipientsGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
		this.mon(this.safeRecipientsGrid.getView(), 'refresh', this.onRefreshView, this);

		this.mon(this.safeRecipientsGrid.getStore(), {
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
		if (!Ext.isEmpty(this.safeRecipientsGrid.getSafeSenders())) {
			this.safeRecipientsGrid.getSelectionModel().selectFirstRow();
		}
		this.deleteAllButton.setDisabled(!gridView.hasRows());
	},

	/**
	 * @param {Ext.grid.RowSelectionModel} selectionModel
	 */
	onGridSelectionChange: function(selectionModel)
	{
		this.deleteButton.setDisabled(!selectionModel.hasSelection());
		this.deleteAllButton.setDisabled(!this.safeRecipientsGrid.getView().hasRows());
	},

	/**
	 * Load safe recipients from JunkMailStore into the grid.
	 */
	update: function()
	{
		var entries = Grommunio.mail.data.JunkMailStore.getSafeRecipients();
		var data = {'item': []};
		Ext.each(entries, function(item, index) {
			data.item.push({name: item, id: index});
		});
		this.loadingView = true;
		this.safeRecipientsGrid.getStore().loadData(data);
		this.loadingView = false;
	},

	/**
	 * Save safe recipients from the grid back to JunkMailStore.
	 */
	updateSettings: function()
	{
		if (Grommunio.mail.data.JunkMailStore.loaded) {
			Grommunio.mail.data.JunkMailStore.setSafeRecipients(this.safeRecipientsGrid.getSafeSenders());
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
		if (this.safeRecipientsGrid.addEntry(this.addField.getValue())) {
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
		this.safeRecipientsGrid.deleteSafeSender();
	},

	/**
	 * @private
	 */
	onDeleteAll: function()
	{
		this.safeRecipientsGrid.deleteAllSafeSender();
	}
});

Ext.reg('grommunio.settingssaferecipientswidget', Grommunio.mail.settings.SettingsSafeRecipientsWidget);
