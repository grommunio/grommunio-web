Ext.namespace('Grommunio.mail.settings');

/**
 * @class Grommunio.mail.settings.SettingsOutOfOfficeCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingsoutofofficecategory
 *
 * The category for users which willallow the user to configure Out-of-Office related settings
 */
Grommunio.mail.settings.SettingsOutOfOfficeCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.outofoffice
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.mail.settings.SettingsOutOfOfficeCategory Out of Office Category}.
	 * @param {Grommunio.mail.settings.SettingsOutOfOfficeCategory} category The Out of Office
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Out of Office'),
			categoryIndex: 2,
			iconCls: 'grommunio-settings-category-oof',
			items: [{
				xtype: 'grommunio.settingsoofwidget',
				settingsContext: config.settingsContext
			},
			container.populateInsertionPoint('context.settings.category.outofoffice', this)
			]
		});

		Grommunio.mail.settings.SettingsOutOfOfficeCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the
	 * {@link Grommunio.settings.SettingsContextModel ContextModel}#{@link Grommunio.settings.SettingsContextModel#beforesavesettings beforesavesettings}
	 * event. It will register the 'beforesave' event on {@link Grommunio.mail.settings.OofStore  outofoffice Store}.
	 * @private
	 */
	onBeforeSaveSettingsModel: function()
	{
		var store = this.get(0).getOofStore();
		this.mon(store, 'beforesave', this.onBeforeSaveOofSettings, this, { single: true });
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.mail.settings.OofStore outofoffice Store}
	 * fires the 'beforesave' event. This will {@link #displaySavingMask show a notification} and register the
	 * event handlers for the completion of the save.
	 * @private
	 */
	onBeforeSaveOofSettings: function()
	{
		this.displaySavingMask();

		var store = this.get(0).getOofStore();
		this.mon(store, 'save', this.onOofSettingsSave, this);
		this.mon(store, 'exception', this.onOofSettingsException, this);
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.mail.settings.OofStore outofoffice Store}
	 * fires the 'save' event indicating the successful save of the out of office settings. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onOofSettingsSave: function()
	{
		this.hideSavingMask(true);

		var store = this.get(0).getOofStore();
		this.mun(store, 'save', this.onOofSettingsSave, this);
		this.mun(store, 'exception', this.onOofSettingsException, this);
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.mail.settings.OofStore outofoffice Store}
	 * fires the 'exception' event indicating a failing save of the out of office settings. This will
	 * {@link #hideSavingMask hide the notification}.
	 * @private
	 */
	onOofSettingsException: function()
	{
		this.hideSavingMask(false);

		var store = this.get(0).getOofStore();
		this.mun(store, 'save', this.onOofSettingsSave, this);
		this.mun(store, 'exception', this.onOofSettingsException, this);
	}

});

Ext.reg('grommunio.settingsoutofofficecategory', Grommunio.mail.settings.SettingsOutOfOfficeCategory);
