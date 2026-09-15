Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsGeneralCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingsgeneralcategory
 *
 * The default available category for users which will
 * load the default settings options which are available for the user.
 */
Grommunio.settings.ui.SettingsGeneralCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.general
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.settings.ui.SettingsGeneralCategory General Category}.
	 * @param {Grommunio.settings.ui.SettingsGeneralCategory} category The general
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
			title: _('General'),
			categoryIndex: 0,
			iconCls: 'icon_cogwheel',
			items: [{
					xtype: 'grommunio.settingsaccountwidget'
				},{
					xtype: 'grommunio.settingsdisplaywidget'
				},{
					xtype: 'grommunio.settingsinboxnavigationwidget'
				},{
					xtype: 'grommunio.settingsfilepreviewerwidget'
				},{
					xtype: 'grommunio.settingsundoredowidget'
				},{
					xtype: 'grommunio.settingsaddressbookwidget'
				},{
					xtype: 'grommunio.settingsquotainfowidget'
				},{
					xtype: 'grommunio.settingsversionwidget',
					settingsContext: config.settingsContext
				}, container.populateInsertionPoint('context.settings.category.general', this)
			]
		});

		Grommunio.settings.ui.SettingsGeneralCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingsgeneralcategory', Grommunio.settings.ui.SettingsGeneralCategory);
