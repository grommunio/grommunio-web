Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsSafeSendersWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingssafesenderswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the safe senders list, backed by the Outlook-compatible FAI message.
 */
Zarafa.mail.settings.SettingsSafeSendersWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Safe Senders'),
			cls: 'zarafa-settings-widget k-settings-nogap',
			xtype: 'zarafa.settingssafesenderswidget',
			height: 400,
			layout: {
				type: 'vbox',
				align: 'stretch',
				pack: 'start'
			},
			items: [{
				xtype: 'displayfield',
				value: _('To protect your privacy email addresses or domains can only be added via the "Add to safe sender list" functionality in an opened email.'),
				fieldClass: 'x-form-display-field zarafa-settings-widget-extrainfo'
			},{
				xtype: 'container',
				layout: {
					type: 'hbox',
					pack: 'start'
				},
				items: [{
					xtype: 'zarafa.safesendergrid',
					ref: '../safeSendersGrid',
					emptyText: _('Safe Senders list is empty'),
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
						xtype: 'button',
						handler: this.onDeleteSafeSender,
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
						width: 130,
						handler: this.onDeleteAll,
						ref: '../../deleteAllButton',
						disabled: true,
						scope: this
					}]
				}]
			}]
		});

		Zarafa.mail.settings.SettingsSafeSendersWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize events for the widget.
	 * @private
	 */
	initEvents: function()
	{
		Zarafa.mail.settings.SettingsSafeSendersWidget.superclass.initEvents.call(this);

		this.mon(this.safeSendersGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
		this.mon(this.safeSendersGrid.getView(), 'refresh', this.onRefreshView, this);

		this.mon(this.getStore(), {
			'remove': this.doStoreRemove,
			'clear': this.doStoreRemove,
			scope: this
		});

		// The lists may arrive after the category was opened.
		this.mon(Zarafa.mail.data.JunkMailStore, 'load', this.update, this);
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
		var entries = Zarafa.mail.data.JunkMailStore.getSafeSenders();
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
		if (Zarafa.mail.data.JunkMailStore.loaded) {
			Zarafa.mail.data.JunkMailStore.setSafeSenders(this.safeSendersGrid.getSafeSenders());
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

Ext.reg('zarafa.settingssafesenderswidget', Zarafa.mail.settings.SettingsSafeSendersWidget);
