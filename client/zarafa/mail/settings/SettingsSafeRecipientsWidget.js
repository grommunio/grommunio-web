Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsSafeRecipientsWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingssaferecipientswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the safe recipients list, backed by the Outlook-compatible FAI message.
 */
Zarafa.mail.settings.SettingsSafeRecipientsWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Safe Recipients'),
			xtype: 'zarafa.settingssaferecipientswidget',
			height: 400,
			layout: {
				type: 'vbox',
				align: 'stretch',
				pack: 'start'
			},
			items: [{
				xtype: 'displayfield',
				value: _('Mailing lists or distribution lists that you have added to the Safe Recipients List are considered trustworthy.'),
				fieldClass: 'x-form-display-field k-safesenders-extrainfo'
			},{
				xtype: 'spacer',
				height: 10
			},{
				xtype: 'container',
				layout: {
					type: 'hbox',
					pack: 'start'
				},
				items: [{
					xtype: 'zarafa.safesendergrid',
					ref: '../safeRecipientsGrid',
					emptyText: _('Safe Recipients list is empty'),
					flex: 1
				},{
					xtype: 'container',
					height: 400,
					width: 160,
					layout: {
						type: 'vbox',
						align: 'center',
						pack: 'start'
					},
					items: [{
						xtype: 'textfield',
						ref: '../../addField',
						emptyText: _('user@domain or @domain'),
						width: 130,
						listeners: {
							specialkey: this.onAddFieldKey,
							scope: this
						}
					},{
						xtype: 'spacer',
						height: 10
					},{
						xtype: 'button',
						text: _('Add'),
						handler: this.onAddEntry,
						width: 130,
						scope: this
					},{
						xtype: 'spacer',
						height: 20
					},{
						xtype: 'button',
						handler: this.onDeleteEntry,
						text: _('Delete'),
						width: 130,
						ref: '../../deleteButton',
						disabled: true,
						scope: this
					},{
						xtype: 'spacer',
						height: 20
					},{
						xtype: 'button',
						text: _('Delete all'),
						handler: this.onDeleteAll,
						width: 130,
						ref: '../../deleteAllButton',
						disabled: true,
						scope: this
					}]
				}]
			}]
		});

		Zarafa.mail.settings.SettingsSafeRecipientsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @private
	 */
	initEvents: function()
	{
		Zarafa.mail.settings.SettingsSafeRecipientsWidget.superclass.initEvents.call(this);

		this.mon(this.safeRecipientsGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
		this.mon(this.safeRecipientsGrid.getView(), 'refresh', this.onRefreshView, this);

		this.mon(this.safeRecipientsGrid.getStore(), {
			'add': this.doStoreRemove,
			'remove': this.doStoreRemove,
			'clear': this.doStoreRemove,
			scope: this
		});

		// The lists may arrive after the category was opened.
		this.mon(Zarafa.mail.data.JunkMailStore, 'load', this.update, this);
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
		var entries = Zarafa.mail.data.JunkMailStore.getSafeRecipients();
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
		if (Zarafa.mail.data.JunkMailStore.loaded) {
			Zarafa.mail.data.JunkMailStore.setSafeRecipients(this.safeRecipientsGrid.getSafeSenders());
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

Ext.reg('zarafa.settingssaferecipientswidget', Zarafa.mail.settings.SettingsSafeRecipientsWidget);
