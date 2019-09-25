Ext.namespace('Zarafa.plugins.passwd.settings');

/**
 * @class Zarafa.plugins.passwd.settings.SettingsPasswdCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingspasswdcategory
 *
 * The passwd settings category that will allow users to change their passwords
 */
Zarafa.plugins.passwd.settings.SettingsPasswdCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Change Password'),
			categoryIndex : 9997,
			iconCls : 'zarafa-settings-category-password',
			xtype : 'zarafa.settingspasswdcategory',
			items : [{
				xtype : 'zarafa.settingspasswdwidget',
				settingsContext : config.settingsContext
			},
				container.populateInsertionPoint('context.settings.category.passwd', this)
			]
		});

		Zarafa.plugins.passwd.settings.SettingsPasswdCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingspasswdcategory', Zarafa.plugins.passwd.settings.SettingsPasswdCategory);
