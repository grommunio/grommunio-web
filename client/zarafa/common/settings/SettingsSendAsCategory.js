Ext.namespace('Zarafa.common.settings');

/**
 * @class Zarafa.common.settings.SettingsSendAsCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingssendascategory
 *
 * The sendas category for users which will allow the user to configure send as settings.
 */
Zarafa.common.settings.SettingsSendAsCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.sendas
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.common.settings.SettingsSendAsCategory SendAs Category}.
	 * @param {Zarafa.common.settings.SettingsSendAsCategory} category The sendas
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
			title : _('Send As'),
			categoryIndex : 6,
			xtype : 'zarafa.settingssendascategory',
			iconCls : 'zarafa-settings-category-sendas',
			items : [{
					xtype : 'zarafa.settingssendaswidget',
					settingsContext : config.settingsContext
				},
				container.populateInsertionPoint('context.settings.category.sendas', this)
			]
		});

		Zarafa.common.settings.SettingsSendAsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingssendascategory', Zarafa.common.settings.SettingsSendAsCategory);
