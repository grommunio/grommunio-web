Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsCopyrightCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingscopyrightcategory
 *
 * Special Settings Category which shows the copyright notice
 * of WebApp and any possible plugins which register their own
 * copyright notices.
 */
Zarafa.settings.ui.SettingsCopyrightCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.copyright
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.settings.ui.SettingsCopyrightCategory Copyright Category}.
	 * @param {Zarafa.settings.ui.SettingsCopyrightCategory} category The copyright
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
			title : _('About'),
			categoryIndex : 10000,
			iconCls : 'zarafa-settings-category-copyright',
			items : [{
				xtype : 'zarafa.settingscopyrightwidget',
				about : Zarafa.ABOUT
			}, container.populateInsertionPoint('context.settings.category.copyright', this)
			]
		});

		Zarafa.settings.ui.SettingsCopyrightCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingscopyrightcategory', Zarafa.settings.ui.SettingsCopyrightCategory);
