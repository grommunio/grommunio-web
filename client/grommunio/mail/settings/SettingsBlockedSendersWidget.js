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
				flex: 1,
				layout: {
					type: 'hbox',
					align: 'stretch',
					pack: 'start'
				},
				items: [{
					xtype: 'grommunio.safesendergrid',
					ref: '../blockedSendersGrid',
					emptyText: _('Blocked Senders list is empty'),
					flex: 1
				},{
					xtype: 'container',
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
