Ext.namespace('Zarafa.plugins.templatesnippets');

/**
 * @class Zarafa.plugins.templatesnippets.TemplateSnippetsPlugin
 * @extends Zarafa.core.Plugin
 *
 * Plugin that allows users to insert predefined text snippets (templates)
 * into mail compositions. Supports both system-provided and user-defined
 * templates with separate HTML and plain text representations.
 */
Zarafa.plugins.templatesnippets.TemplateSnippetsPlugin = Ext.extend(Zarafa.core.Plugin, {

	initPlugin: function() {
		Zarafa.plugins.templatesnippets.TemplateSnippetsPlugin.superclass.initPlugin.apply(this, arguments);

		this.registerInsertionPoint('context.mail.mailcreatecontentpanel.toolbar.actions', this.createTemplateButton, this);
		this.registerInsertionPoint('context.settings.categories', this.createSettingsCategory, this);
	},

	/**
	 * Create the "Insert Template" button for the mail compose toolbar.
	 * An initial empty menu is attached so the dropdown arrow is visible immediately.
	 * @return {Object} Button config
	 */
	createTemplateButton: function() {
		return {
			xtype: 'button',
			overflowText: _('Insert Template'),
			tooltip: _('Insert a text template at the cursor position'),
			iconCls: 'icon_templatesnippets',
			scope: this,
			plugins: ['zarafa.recordcomponentupdaterplugin'],
			menu: {
				xtype: 'menu',
				listeners: {
					click: this.onTemplateSelect,
					scope: this
				},
				items: [{
					text: _('Loading\u2026'),
					disabled: true
				}]
			},
			listeners: {
				afterrender: this.onTemplateButtonRendered,
				scope: this
			},
			update: function(record) {
				this.record = record;
			}
		};
	},

	/**
	 * After the template button is rendered, build the dropdown menu
	 * and listen for settings changes so it stays in sync.
	 * @param {Ext.Button} button The rendered button
	 */
	onTemplateButtonRendered: function(button) {
		this.templateButton = button;
		this.buildTemplateMenu(button);

		var settingsModel = container.getSettingsModel();
		settingsModel.on('set', this.onSettingsChanged, this);
		settingsModel.on('remove', this.onSettingsChanged, this);
	},

	/**
	 * Rebuild the menu when user templates are changed in settings.
	 * @param {Zarafa.settings.SettingsModel} settingsModel
	 * @param {Object} changedSettings
	 */
	onSettingsChanged: function(settingsModel, changedSettings) {
		if (!this.templateButton) {
			return;
		}
		var dominated = false;
		if (!Ext.isEmpty(changedSettings)) {
			if (!Array.isArray(changedSettings)) {
				changedSettings = [changedSettings];
			}
			for (var i = 0; i < changedSettings.length; i++) {
				if (changedSettings[i].path && changedSettings[i].path.indexOf('zarafa/v1/plugins/templatesnippets') >= 0) {
					dominated = true;
					break;
				}
			}
			if (!dominated) {
				return;
			}
		}
		this.buildTemplateMenu(this.templateButton);
	},

	/**
	 * Build or rebuild the dropdown menu of templates.
	 * Groups system templates and user templates with a separator.
	 * @param {Ext.Button} button
	 */
	buildTemplateMenu: function(button) {
		var menuItems = [];
		var settingsModel = container.getSettingsModel();

		// System templates
		var systemTemplates = settingsModel.get('zarafa/v1/plugins/templatesnippets/system_templates', true);
		if (systemTemplates) {
			var hasSys = false;
			for (var skey in systemTemplates) {
				if (systemTemplates.hasOwnProperty(skey)) {
					hasSys = true;
					menuItems.push({
						text: Ext.util.Format.htmlEncode(systemTemplates[skey].name),
						iconCls: 'icon_templatesnippets_system',
						templateKey: skey,
						templateSource: 'system',
						templateData: systemTemplates[skey]
					});
				}
			}
			if (hasSys) {
				menuItems.push({ xtype: 'menuseparator' });
			}
		}

		// User templates
		var userTemplates = settingsModel.get('zarafa/v1/plugins/templatesnippets/user_templates', true);
		if (userTemplates) {
			for (var ukey in userTemplates) {
				if (userTemplates.hasOwnProperty(ukey)) {
					menuItems.push({
						text: Ext.util.Format.htmlEncode(userTemplates[ukey].name),
						iconCls: 'icon_templatesnippets_user',
						templateKey: ukey,
						templateSource: 'user',
						templateData: userTemplates[ukey]
					});
				}
			}
		}

		if (menuItems.length === 0 || (menuItems.length === 1 && menuItems[0].xtype === 'menuseparator')) {
			menuItems = [{
				text: _('No templates available'),
				disabled: true
			}];
		}

		if (button.menu) {
			button.menu.removeAll();
			button.menu.add(menuItems);
		}
	},

	/**
	 * Handle template selection from the dropdown menu.
	 * @param {Ext.menu.Menu} menu
	 * @param {Ext.menu.Item} menuItem
	 */
	onTemplateSelect: function(menu, menuItem) {
		if (!menuItem || !menuItem.templateData) {
			return;
		}

		var tpl = menuItem.templateData;

		// Walk up from the button to find the editor field
		var editorField = this.findEditorField(this.templateButton);
		if (!editorField) {
			return;
		}

		var useHtml = editorField.isHtmlEditor();
		var content = '';

		if (useHtml) {
			if (tpl.html) {
				content = tpl.html;
			} else if (tpl.text) {
				content = Zarafa.core.HTMLParser.convertPlainToHTML(tpl.text);
			}
		} else {
			if (tpl.text) {
				content = tpl.text;
			} else if (tpl.html) {
				content = Zarafa.core.HTMLParser.convertHTMLToPlain(tpl.html);
			}
		}

		if (content) {
			editorField.insertAtCursor(content);
		}
	},

	/**
	 * Navigate from a component up to the EditorField in the compose window.
	 * @param {Ext.Component} cmp Starting component
	 * @return {Zarafa.common.ui.EditorField|null}
	 */
	findEditorField: function(cmp) {
		while (cmp) {
			if (cmp.editorField) {
				return cmp.editorField;
			}
			if (cmp.mainPanel && cmp.mainPanel.editorField) {
				return cmp.mainPanel.editorField;
			}
			cmp = cmp.ownerCt;
		}
		return null;
	},

	/**
	 * Create the settings category for the plugin.
	 * @return {Object} Settings category config
	 */
	createSettingsCategory: function() {
		return {
			xtype: 'zarafa.settingstemplatesnippetscategory',
			settingsContext: arguments[2]
		};
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name: 'templatesnippets',
		displayName: _('Template Snippets'),
		pluginConstructor: Zarafa.plugins.templatesnippets.TemplateSnippetsPlugin
	}));
});
