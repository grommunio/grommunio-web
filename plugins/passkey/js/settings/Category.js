Ext.namespace('Zarafa.plugins.passkey.settings');

/**
 * @class Zarafa.plugins.passkey.settings.Category
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.plugins.passkey.category
 *
 * Settings category for the Passkey plugin.
 *
 * @insert context.settings.category.passkey
 * Insertion point that allows other plugins to add extra widgets to the
 * passkey settings category.
 */
Zarafa.plugins.passkey.settings.Category = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Passkey authentication'),
			categoryIndex: 9997,
			iconCls: 'icon_passkey_settings',
			items: [{
				xtype: 'zarafa.plugins.passkey.generalsettingswidget',
				settingsContext: config.settingsContext
			},
			container.populateInsertionPoint('context.settings.category.passkey', this)
			]
		});

		Zarafa.plugins.passkey.settings.Category.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.plugins.passkey.category', Zarafa.plugins.passkey.settings.Category);
