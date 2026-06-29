Ext.namespace('Zarafa.plugins.ai.settings');

/**
 * @class Zarafa.plugins.ai.settings.SettingsAICategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingsaicategory
 *
 * The settings category for the AI Assistant plugin.
 */
Zarafa.plugins.ai.settings.SettingsAICategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

	constructor: function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			title: _('AI Assistant'),
			categoryIndex: 9950,
			iconCls: 'icon_ai',
			items: [{
				xtype: 'zarafa.settingsaiwidget',
				settingsContext: config.settingsContext
			}]
		});
		Zarafa.plugins.ai.settings.SettingsAICategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingsaicategory', Zarafa.plugins.ai.settings.SettingsAICategory);
