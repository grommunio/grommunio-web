Ext.namespace('Grommunio.plugins.templatesnippets.settings');

/**
 * @class Grommunio.plugins.templatesnippets.settings.SettingsTemplateSnippetsCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingstemplatesnippetscategory
 *
 * Settings category for managing Template Snippets.
 */
Grommunio.plugins.templatesnippets.settings.SettingsTemplateSnippetsCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {

	constructor: function(config) {
		config = config || {};
		Ext.applyIf(config, {
			title: _('Template Snippets'),
			categoryIndex: 9945,
			iconCls: 'icon_templatesnippets',
			items: [{
				xtype: 'grommunio.settingstemplatesnippetswidget',
				settingsContext: config.settingsContext
			}]
		});
		Grommunio.plugins.templatesnippets.settings.SettingsTemplateSnippetsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingstemplatesnippetscategory', Grommunio.plugins.templatesnippets.settings.SettingsTemplateSnippetsCategory);
