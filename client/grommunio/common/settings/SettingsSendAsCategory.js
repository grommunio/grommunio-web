Ext.namespace('Grommunio.common.settings');

/**
 * @class Grommunio.common.settings.SettingsSendAsCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingssendascategory
 *
 * The sendas category for users which will allow the user to configure send as settings.
 */
Grommunio.common.settings.SettingsSendAsCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.sendas
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.common.settings.SettingsSendAsCategory SendAs Category}.
	 * @param {Grommunio.common.settings.SettingsSendAsCategory} category The sendas
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
			title: _('From Addresses'),
			categoryIndex: 6,
			xtype: 'grommunio.settingssendascategory',
			iconCls: 'grommunio-settings-category-sendas',
			items: [{
					xtype: 'grommunio.settingssendaswidget',
					settingsContext: config.settingsContext
				},
				container.populateInsertionPoint('context.settings.category.sendas', this)
			]
		});

		Grommunio.common.settings.SettingsSendAsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingssendascategory', Grommunio.common.settings.SettingsSendAsCategory);
