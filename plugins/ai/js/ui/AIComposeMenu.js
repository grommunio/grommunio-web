Ext.namespace('Zarafa.plugins.ai.ui');

/**
 * @class Zarafa.plugins.ai.ui.AIComposeMenu
 * @singleton
 *
 * Builds the "AI" split-button for the mail composer toolbar. Its menu offers
 * operations on the current draft text (improve, shorten, expand, change tone,
 * fix grammar, translate). The editor is resolved at click time via a holder
 * closed over by the menus, so submenu items work too.
 */
Zarafa.plugins.ai.ui.AIComposeMenu = {

	/**
	 * Build the composer split-button config.
	 * @param {Zarafa.plugins.ai.AIPlugin} plugin Scope for the click handler.
	 * @return {Object} Button config.
	 */
	createButton: function(plugin)
	{
		var holder = { button: null };
		var getEditor = function() {
			return holder.button ? Zarafa.plugins.ai.ui.AIComposeMenu.findEditorField(holder.button) : null;
		};

		return {
			xtype: 'splitbutton',
			// Icon-only, matching the composer toolbar's other buttons (Save,
			// Delete, attachment, ...) and avoiding any toolbar overflow.
			tooltip: _('AI writing assistant'),
			overflowText: _('AI writing assistant'),
			iconCls: 'icon_ai',
			cls: 'k-ai-toolbar-btn',
			plugins: ['zarafa.recordcomponentupdaterplugin'],
			menu: this.buildMenu(plugin, getEditor),
			handler: function() {
				this.showMenu();
			},
			listeners: {
				afterrender: function(button) {
					holder.button = button;
				}
			},
			update: function(record) {
				this.record = record;
			}
		};
	},

	/**
	 * Build the compose menu and submenus, tagging each with the editor getter.
	 * @param {Zarafa.plugins.ai.AIPlugin} plugin
	 * @param {Function} getEditor
	 * @return {Object} Menu config.
	 */
	buildMenu: function(plugin, getEditor)
	{
		var listeners = { click: plugin.onComposeMenuClick, scope: plugin };

		var tones = [
			['formal', _('Formal')],
			['friendly', _('Friendly')],
			['confident', _('Confident')],
			['concise', _('Concise')],
			['casual', _('Casual')]
		];
		var toneItems = tones.map(function(tone) {
			return { text: tone[1], aiOpts: { operation: 'tone', tone: tone[0] } };
		});

		var languages = ['English', 'German', 'French', 'Spanish', 'Italian', 'Dutch', 'Portuguese', 'Polish', 'Chinese', 'Japanese'];
		var translateItems = [{ text: _('My language'), aiOpts: { operation: 'translate', target: '' } }];
		languages.forEach(function(language) {
			translateItems.push({ text: language, aiOpts: { operation: 'translate', target: language } });
		});

		return {
			xtype: 'menu',
			getEditor: getEditor,
			listeners: listeners,
			items: [{
				text: _('Improve writing'),
				iconCls: 'icon_ai',
				aiOpts: { operation: 'improve' }
			}, {
				text: _('Shorten'),
				aiOpts: { operation: 'shorten' }
			}, {
				text: _('Expand'),
				aiOpts: { operation: 'expand' }
			}, {
				text: _('Change tone'),
				menu: { xtype: 'menu', getEditor: getEditor, listeners: listeners, items: toneItems }
			}, {
				text: _('Fix grammar & spelling'),
				aiOpts: { operation: 'grammar' }
			}, {
				text: _('Translate'),
				menu: { xtype: 'menu', getEditor: getEditor, listeners: listeners, items: translateItems }
			}]
		};
	},

	/**
	 * Walk up from a component to the composer's editor field.
	 * @param {Ext.Component} cmp
	 * @return {Zarafa.common.ui.EditorField|null}
	 */
	findEditorField: function(cmp)
	{
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
	}
};
