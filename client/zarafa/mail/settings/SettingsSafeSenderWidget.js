Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsSafeSendersWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingssafesenderswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * safesenders in the {@link Zarafa.mail.settings.SettingsMailCategory mail category}
 */
Zarafa.mail.settings.SettingsSafeSendersWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {
	/**
	 * @property {Zarafa.settings.SettingsModel} model
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Safe Senders'),
			xtype: 'zarafa.settingssafesenderswidget',
			name: 'zarafa/v1/contexts/mail/safe_senders_list',
			height: 400,
			layout: {
				type: 'vbox',
				align: 'stretch',
				pack: 'start'
			},
			items: [{
				xtype: 'displayfield',
				value: _('To protect your privacy email addresses or domains can only be added via the "Add to safe sender list" functionality in an opened email.'),
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
					ref: '../safeSendersGrid',
					flex:1
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

		// register event to enable/disable buttons
		this.mon(this.safeSendersGrid.getSelectionModel(), 'selectionchange', this.onGridSelectionChange, this);
		this.mon(this.safeSendersGrid.getView(), 'refresh', this.onRefreshView, this);

		// register event to set settingsContextModel dirty.
		this.mon(this.getStore(), {
			'remove': this.doStoreRemove,
			'clear': this.doStoreRemove,
			scope: this
		});
	},

	/**
	 * Event handler will be called when grid is refreshed in {@link Zarafa.mail.settings.SafeSenderGrid GridView}
	 * This handler will toggle 'Delete All' button and select first row of grid on every refresh.
	 * @param {Ext.grid.View} gridView that fired the event
	 */
	onRefreshView: function(gridView)
	{
		var safeSendersGrid = this.safeSendersGrid;
		if (!Ext.isEmpty(safeSendersGrid.getSafeSenders())) {
			safeSendersGrid.getSelectionModel().selectFirstRow();
		}

		var hasRows = gridView.hasRows();
		this.deleteAllButton.setDisabled(!hasRows);
	},

	/**
	 * Returns the {@link Ext.data.JsonStore store} associated
	 * with grid in this widget.
	 * @return {Ext.data.JsonStore} The store
	 */
	getStore: function()
	{
		return this.safeSendersGrid.getStore();
	},

	/**
	 * Event handler will be called when selection in {@link Zarafa.mail.settings.SafeSenderGrid safesenderGrid}
	 * has been changed.
	 * @param {Ext.grid.RowSelectionModel} selectionModel selection model that fired the event
	 */
	onGridSelectionChange: function(selectionModel)
	{
		var hasSelection = selectionModel.hasSelection();
		var hasRows = this.safeSendersGrid.getView().hasRows();

		// Disable the 'Delete' button if there is no selected rows
		// and also disable 'Delete All' button if there is no row left in grid.
		this.deleteButton.setDisabled(!hasSelection);
		this.deleteAllButton.setDisabled(!hasRows);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI grid of this widget.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;
		var safeSenders = settingsModel.get(this.name, true);

		// Load all safesenders into the GridPanel
		var safeSendersNameList = {'item': []};
		Ext.each(safeSenders, function(item, index) {
			safeSendersNameList.item.push({name: item, id: index});
		});

		var store = this.getStore();
		store.loadData(safeSendersNameList);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
	{
		settingsModel.beginEdit();
		settingsModel.set(this.safeSendersGrid.name, this.safeSendersGrid.getSafeSenders());
		settingsModel.endEdit();
	},

	/**
	 * Event handler for the {@link Ext.data.JsonStore#remove} event which is fired
	 * by the {@link Ext.data.JsonStore JsonStore} associated with the {@link #safeSendersGrid}.
	 * This will mark the {@link Zarafa.settings.SettingsContextModel} as
	 * {@link Zarafa.settings.SettingsContextModel#setDirty dirty}.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which is removed
	 * @param {Number} index index of the record in store which is removed
	 * @private
	 */
	doStoreRemove: function(store, record, index)
	{
		this.settingsContext.getModel().setDirty();
	},

	/**
	 * Handler function which is called when the 'Delete' button has been pressed. This
	 * will call {@link Zarafa.mail.settings.SafeSenderGrid#deleteSafeSender} to remove selected row in
	 * {@link Zarafa.mail.settings.SafeSenderGrid grid}
	 * @private
	 */
	onDeleteSafeSender: function()
	{
		this.safeSendersGrid.deleteSafeSender();
	},

	/**
	 * Handler function which is called when the 'Delete all' button has been pressed. This
	 * will call {@link Zarafa.mail.settings.SafeSenderGrid#deleteAllSafeSender} to remove all rows in
	 * {@link Zarafa.mail.settings.SafeSenderGrid grid}
	 * @private
	 */
	onDeleteAll: function()
	{
		this.safeSendersGrid.deleteAllSafeSender();
	}

});

Ext.reg('zarafa.settingssafesenderswidget', Zarafa.mail.settings.SettingsSafeSendersWidget);
