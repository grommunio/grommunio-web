Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsOutOfOfficeCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingsoutofofficecategory
 *
 * The category for users which willallow the user to configure Out-of-Office related settings
 */
Zarafa.mail.settings.SettingsOutOfOfficeCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.outofoffice
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.mail.settings.SettingsOutOfOfficeCategory Out of Office Category}.
	 * @param {Zarafa.mail.settings.SettingsOutOfOfficeCategory} category The Out of Office
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Out of Office'),
			categoryIndex : 2,
			iconCls : 'zarafa-settings-category-oof',
			items : [{
				xtype : 'zarafa.settingsoofwidget',
				settingsContext : config.settingsContext
			},
			container.populateInsertionPoint('context.settings.category.outofoffice', this)
			]
		});

		Zarafa.mail.settings.SettingsOutOfOfficeCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the
	 * {@link Zarafa.settings.SettingsContextModel ContextModel}#{@link Zarafa.settings.SettingsContextModel#beforesavesettings beforesavesettings}
	 * event. It will register the 'beforesave' event on {@link Zarafa.mail.settings.OofStore  outofoffice Store}.
	 * @private
	 */
	onBeforeSaveSettingsModel : function()
	{
		var store = this.get(0).getOofStore();
		this.mon(store, 'beforesave', this.onBeforeSaveOofSettings, this, { single : true });
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.mail.settings.OofStore outofoffice Store}
	 * fires the 'beforesave' event. This will {@link #displaySavingMask show a notification} and register the
	 * event handlers for the completion of the save.
	 * @private
	 */
	onBeforeSaveOofSettings : function()
	{
		this.displaySavingMask();

		var store = this.get(0).getOofStore();
		this.mon(store, 'save', this.onOofSettingsSave, this);
		this.mon(store, 'exception', this.onOofSettingsException, this);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.mail.settings.OofStore outofoffice Store}
	 * fires the 'save' event indicating the successfull save of the out of office settings. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onOofSettingsSave : function()
	{
		this.hideSavingMask(true);

		var store = this.get(0).getOofStore();
		this.mun(store, 'save', this.onOofSettingsSave, this);
		this.mun(store, 'exception', this.onOofSettingsException, this);
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.mail.settings.OofStore outofoffice Store}
	 * fires the 'exception' event indicating a failing save of the out of office settings. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onOofSettingsException : function()
	{
		this.hideSavingMask(false);

		var store = this.get(0).getOofStore();
		this.mun(store, 'save', this.onOofSettingsSave, this);
		this.mun(store, 'exception', this.onOofSettingsException, this);
	}

});

Ext.reg('zarafa.settingsoutofofficecategory', Zarafa.mail.settings.SettingsOutOfOfficeCategory);
