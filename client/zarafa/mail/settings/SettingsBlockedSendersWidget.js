Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsBlockedSendersWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsblockedsenderswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the blocked senders list, backed by the Outlook-compatible FAI message.
 */
Zarafa.mail.settings.SettingsBlockedSendersWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Blocked Senders'),
			xtype: 'zarafa.settingsblockedsenderswidget',
			height: 400,
			layout: {
				type: 'vbox',
				align: 'stretch',
				pack: 'start'
			},
			items: [{
				xtype: 'displayfield',
				value: _('External content from blocked senders will always be blocked, even if the global block external content setting is disabled. Safe senders take priority over blocked senders.'),
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
					ref: '../blockedSendersGrid',
					emptyText: _('Blocked Senders list is empty'),
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
						height: 10
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

		Zarafa.mail.settings.SettingsBlockedSendersWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @private
	 */
	initEvents: function()
	{
		Zarafa.mail.settings.SettingsBlockedSendersWidget.superclass.initEvents.call(this);

		this.mon(this.blockedSendersGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
		this.mon(this.blockedSendersGrid.getView(), 'refresh', this.onRefreshView, this);

		this.mon(this.blockedSendersGrid.getStore(), {
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
		var entries = Zarafa.mail.data.JunkMailStore.getBlockedSenders();
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
		if (Zarafa.mail.data.JunkMailStore.loaded) {
			Zarafa.mail.data.JunkMailStore.setBlockedSenders(this.blockedSendersGrid.getSafeSenders());
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

Ext.reg('zarafa.settingsblockedsenderswidget', Zarafa.mail.settings.SettingsBlockedSendersWidget);
