Ext.namespace('Grommunio.plugins.ai.settings');

/**
 * @class Grommunio.plugins.ai.settings.SettingsAICategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingsaicategory
 *
 * The settings category for the AI Assistant plugin.
 */
Grommunio.plugins.ai.settings.SettingsAICategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {

	constructor: function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			title: _('AI Assistant'),
			categoryIndex: 9950,
			iconCls: 'icon_ai',
			items: [{
				xtype: 'grommunio.settingsaiwidget',
				settingsContext: config.settingsContext
			}]
		});
		Grommunio.plugins.ai.settings.SettingsAICategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingsaicategory', Grommunio.plugins.ai.settings.SettingsAICategory);
