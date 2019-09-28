Ext.namespace('Zarafa.plugins.safesenders');

/**
 * @class Zarafa.plugins.safesenders.SettingsSafeSendersWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype safesenders.settingssafesenderswidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * safesenders in the {@link Zarafa.mail.settings.SettingsMailCategory mail category}
 */
Zarafa.plugins.safesenders.SettingsSafesendersWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = {
			xtype: 'jsonstore',
			fields: [
				{ name : 'id', type : 'int' },
				{ name : 'name' }
			],
			sortInfo : {
				field : 'name',
				direction : 'ASC'
			},
			autoDestroy : true
		};

		Ext.applyIf(config, {
			height : 400,
			title : _('Safe Senders'),
			xtype : 'safesenders.settingssafesenderswidget',
			layout : 'column',
			items : [{
				xtype : 'grid',
				name : 'zarafa/v1/contexts/mail/safe_senders_list',
				ref : 'safesendersGrid',
				columnWidth : 0.5,
				height : 360,
				style:'margin-right:10px',
				store : store,
				hideHeaders : true,
				viewConfig : {
					forceFit : true,
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('Safe Senders List Is Empty') + '</div>'
				},
				columns: [{
					dataIndex : 'name',
					header : '&#160;',
					renderer : Ext.util.Format.htmlEncode // Should be changed to text format?
				}],
				buttons : [{
					text : _('Delete'),
					ref : '../../../delSafesenderBtn',
					handler : this.onDelSafesender,
					scope : this
				}]
			}]
		});

		Zarafa.plugins.safesenders.SettingsSafesendersWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is fired when the 'Delete' button has been pressed. This
	 * will get the selected {@link Ext.data.Record record}
	 * and {@link Ext.data.Store#remove remove} it.
	 * @private
	 */
	onDelSafesender : function()
	{
		var selectionModel = this.safesendersGrid.getSelectionModel()
		var record = selectionModel.getSelected();
		if (record) {
			this.safesendersGrid.getStore().remove(record);
			this.model.set(this.safesendersGrid.name, this.getSafesenders());
		}
	},

	/**
	 * Helper function which returns a list of safe senders from the data store.
	 * @return {Array} list safesenders in store.
	 * @private
	 */
	getSafesenders : function()
	{
		var store = this.safesendersGrid.getStore();
		var list = [];
		store.each(function(record){
		    list.push(record.get('name'));
		});

		return list
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update : function(settingsModel)
	{
		this.model = settingsModel;
		var safesenders = settingsModel.get(this.safesendersGrid.name, true);

		// Load all safesenders into the GridPanel
		var array = []
		Ext.each(safesenders, function(item, index) {
			 array.push({name: item});
		});

		var store = this.safesendersGrid.getStore();
		store.loadData(array);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings : function(settingsModel)
	{
		settingsModel.beginEdit();
		settingsModel.set(this.safesendersGrid.name, this.getSafesenders());
		settingsModel.endEdit();
	}
});

Ext.reg('safesenders.settingssafesenderswidget', Zarafa.plugins.safesenders.SettingsSafesendersWidget);
