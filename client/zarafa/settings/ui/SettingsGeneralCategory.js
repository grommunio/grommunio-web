Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsGeneralCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingsgeneralcategory
 *
 * The default available category for users which will
 * load the default settings options which are available for the user.
 */
Zarafa.settings.ui.SettingsGeneralCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.general
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.settings.ui.SettingsGeneralCategory General Category}.
	 * @param {Zarafa.settings.ui.SettingsGeneralCategory} category The general
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
			title : _('General'),
			categoryIndex : 0,
			iconCls : 'zarafa-settings-category-general',
			items : [{
					xtype : 'zarafa.settingsaccountwidget'
				},{
					xtype : 'zarafa.settingsinboxnavigationwidget'
				},{
					xtype : 'zarafa.settingsdisplaywidget'
				},{
					xtype : 'zarafa.settingsaddressbookwidget'
				},{
					xtype : 'zarafa.settingsquotainfowidget'
				},{
					xtype : 'zarafa.settingsresetsettingswidget',
					settingsContext : config.settingsContext
				},{
					xtype : 'zarafa.settingsversionwidget'
				}, container.populateInsertionPoint('context.settings.category.general', this)
			]
		});

		Zarafa.settings.ui.SettingsGeneralCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingsgeneralcategory', Zarafa.settings.ui.SettingsGeneralCategory);
