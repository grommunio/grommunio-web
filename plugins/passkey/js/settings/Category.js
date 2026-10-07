Ext.namespace('Grommunio.plugins.passkey.settings');

/**
 * @class Grommunio.plugins.passkey.settings.Category
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype passkey.category
 *
 * Settings category for the Passkey plugin.
 *
 * @insert context.settings.category.passkey
 * Insertion point that allows other plugins to add extra widgets to the
 * passkey settings category.
 */
Grommunio.plugins.passkey.settings.Category = Ext.extend(Grommunio.settings.ui.SettingsCategory, {

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
				xtype: 'passkey.generalsettingswidget',
				settingsContext: config.settingsContext
			},
			container.populateInsertionPoint('context.settings.category.passkey', this)
			]
		});

		Grommunio.plugins.passkey.settings.Category.superclass.constructor.call(this, config);
	}
});

Ext.reg('passkey.category', Grommunio.plugins.passkey.settings.Category);
