Ext.namespace('Zarafa.plugins.templatesnippets.settings');

/**
 * @class Zarafa.plugins.templatesnippets.settings.SettingsTemplateSnippetsCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingstemplatesnippetscategory
 *
 * Settings category for managing Template Snippets.
 */
Zarafa.plugins.templatesnippets.settings.SettingsTemplateSnippetsCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

	constructor: function(config) {
		config = config || {};
		Ext.applyIf(config, {
			title: _('Template Snippets'),
			categoryIndex: 9945,
			iconCls: 'icon_templatesnippets',
			items: [{
				xtype: 'zarafa.settingstemplatesnippetswidget',
				settingsContext: config.settingsContext
			}]
		});
		Zarafa.plugins.templatesnippets.settings.SettingsTemplateSnippetsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingstemplatesnippetscategory', Zarafa.plugins.templatesnippets.settings.SettingsTemplateSnippetsCategory);
