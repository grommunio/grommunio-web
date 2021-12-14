Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.settings.ui.SettingsSafeSenderCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingssafesendercategory
 *
 * The category for users which will allow the user to update safe senders list.
 */
Zarafa.mail.settings.SettingsSafeSenderCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

	/**
	 * @insert context.settings.category.safesender
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.mail.settings.SettingsSafeSenderCategory Safe Senders Category}.
	 * @param {Zarafa.mail.settings.SettingsSafeSenderCategory} category The Safe Senders
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
			title: _('Safe Senders'),
			categoryIndex: 8,
			iconCls: 'zarafa-settings-category-delegate',
			items: [{
				xtype: 'zarafa.settingssafesenderswidget',
				settingsContext: config.settingsContext
			},
				container.populateInsertionPoint('context.settings.category.safesender', this)
			]
		});

		Zarafa.mail.settings.SettingsSafeSenderCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingssafesendercategory', Zarafa.mail.settings.SettingsSafeSenderCategory);
