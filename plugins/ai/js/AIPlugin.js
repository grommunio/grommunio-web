Ext.namespace('Zarafa.plugins.ai');

/**
 * @class Zarafa.plugins.ai.AIPlugin
 * @extends Zarafa.core.Plugin
 *
 * The AI Assistant plugin. Adds AI entry points to the mail reading surfaces
 * (preview toolbar, open-mail toolbar, right-click menu) and the settings, and
 * routes each request into the shared {@link Zarafa.plugins.ai.ui.AIAssistantWindow}.
 */
Zarafa.plugins.ai.AIPlugin = Ext.extend(Zarafa.core.Plugin, {

	initPlugin: function()
	{
		Zarafa.plugins.ai.AIPlugin.superclass.initPlugin.apply(this, arguments);

		// Reading pane toolbar (current previewed message).
		this.registerInsertionPoint('previewpanel.toolbar.right', this.createPreviewButton, this);
		// Toolbar of a message opened in its own tab/window.
		this.registerInsertionPoint('context.mail.showmailcontentpanel.toolbar.actions.first', this.createShowMailButton, this);
		// Right-click menu on a message in the list.
		this.registerInsertionPoint('context.mail.contextmenu.actions', this.createContextMenuItems, this);
		// Composer toolbar (writing assistant).
		this.registerInsertionPoint('context.mail.mailcreatecontentpanel.toolbar.actions', this.createComposeButton, this);
		// Settings page.
		this.registerInsertionPoint('context.settings.categories', this.createSettingsCategory, this);
	},

	/**
	 * Build the AI writing-assistant split-button for the composer toolbar.
	 * @return {Object|undefined}
	 */
	createComposeButton: function()
	{
		if (!Zarafa.plugins.ai.AIClient.isFeatureEnabled('compose')) {
			return undefined;
		}
		return Zarafa.plugins.ai.ui.AIComposeMenu.createButton(this);
	},

	/**
	 * Handle a click on a composer AI menu (or submenu) item.
	 * @param {Ext.menu.Menu} menu
	 * @param {Ext.menu.Item} item
	 */
	onComposeMenuClick: function(menu, item)
	{
		if (!item || !item.aiOpts) {
			return;
		}
		var editor = menu.getEditor ? menu.getEditor() : null;
		if (!editor) {
			Ext.MessageBox.alert(_('AI Assistant'), _('The editor could not be found.'));
			return;
		}
		this.runCompose(item.aiOpts, editor);
	},

	/**
	 * Run a compose operation against the editor's current text and present the
	 * result with Insert/Replace actions.
	 * @param {Object} aiOpts operation, tone/target
	 * @param {Zarafa.common.ui.EditorField} editor
	 */
	runCompose: function(aiOpts, editor)
	{
		var client = Zarafa.plugins.ai.AIClient;
		var isHtml = Ext.isFunction(editor.isHtmlEditor) && editor.isHtmlEditor();
		var raw = editor.getValue() || '';
		var text = isHtml ? Zarafa.core.HTMLParser.convertHTMLToPlain(raw) : raw;

		if (!text.replace(/\s+/g, '')) {
			Ext.MessageBox.alert(_('AI Assistant'), _('Write some text in the message first.'));
			return;
		}

		var operation = aiOpts.operation || 'improve';
		var requestOpts = { operation: operation, text: text };
		if (operation === 'tone') {
			requestOpts.tone = aiOpts.tone || client.getSetting('compose_tone', 'neutral');
		} else if (operation === 'translate') {
			requestOpts.target = aiOpts.target ? aiOpts.target : client.translateTarget();
		}

		var titles = {
			improve: _('Improved draft'),
			shorten: _('Shortened draft'),
			expand: _('Expanded draft'),
			grammar: _('Grammar & spelling'),
			tone: _('Rewritten draft'),
			translate: _('Translated draft')
		};

		var toEditor = function(value) {
			// Use the editor's default (proportional) font, not the monospace
			// <pre> that HTMLParser.convertPlainToHTML would produce.
			return isHtml ? client.toEditorHtml(value) : value;
		};

		// The assistant window outlives the composer (it only hides on close), so
		// the captured editor may be gone by the time Insert/Replace is clicked.
		var editorAlive = function() {
			return editor && !editor.isDestroyed;
		};
		var editorGone = function() {
			Ext.MessageBox.alert(_('AI Assistant'), _('The message you were composing is no longer open.'));
		};

		Zarafa.plugins.ai.ui.AIAssistantWindow.showFeature({
			title: titles[operation] || _('AI Assistant'),
			model: client.getModelName(),
			onInsert: function(value) {
				if (!editorAlive()) {
					editorGone();
					return false;
				}
				editor.insertAtCursor(toEditor(value));
			},
			onReplace: function(value) {
				if (!editorAlive()) {
					editorGone();
					return false;
				}
				editor.setValue(toEditor(value));
			},
			runner: function(panel) {
				panel.startLoading();
				client.runCompose(requestOpts, panel);
			}
		});
	},

	/**
	 * Build the AI split-button for the preview toolbar. The current record is
	 * read live from the context model.
	 * @param {String} insertionPoint
	 * @param {Object} options Contains the {Zarafa.core.ContextModel} model.
	 * @return {Object|undefined}
	 */
	createPreviewButton: function(insertionPoint, options)
	{
		if (!Zarafa.plugins.ai.AIClient.isPluginEnabled()) {
			return undefined;
		}
		var model = (options && options.model instanceof Zarafa.core.ContextModel) ? options.model : null;
		return this.createAIButton(model ? function() {
			return model.getPreviewRecord();
		} : null);
	},

	/**
	 * Build the AI split-button for an opened message's toolbar. The record is
	 * delivered through the record-component-updater plugin.
	 * @return {Object|undefined}
	 */
	createShowMailButton: function()
	{
		if (!Zarafa.plugins.ai.AIClient.isPluginEnabled()) {
			return undefined;
		}
		return this.createAIButton(null);
	},

	/**
	 * Build a split-button whose menu offers the reading-side AI features.
	 *
	 * Record acquisition is unified through a holder closed over by the menu:
	 * preview supplies a live getter; the open-mail toolbar pushes the record
	 * via update(). Either source is consulted at click time.
	 *
	 * @param {Function|null} staticRecordFn Optional live record getter.
	 * @return {Object} Button config.
	 */
	createAIButton: function(staticRecordFn)
	{
		var holder = { fn: staticRecordFn || null, record: null };
		var getRecord = function() {
			if (holder.fn) {
				var record = holder.fn();
				if (record) {
					return record;
				}
			}
			return holder.record;
		};

		return {
			xtype: 'splitbutton',
			// Icon-only, matching the other reading-pane toolbar buttons (Delete,
			// More options, Pop-out). A text label here makes the toolbar wider
			// than the pane and can push a horizontal scrollbar onto the app.
			tooltip: _('AI Assistant'),
			overflowText: _('AI Assistant'),
			iconCls: 'icon_ai',
			cls: 'k-ai-toolbar-btn',
			plugins: ['zarafa.recordcomponentupdaterplugin'],
			menu: this.buildAIMenu(getRecord),
			handler: function() {
				this.showMenu();
			},
			update: function(record) {
				this.record = record;
				holder.record = record;
			}
		};
	},

	/**
	 * Build the AI menu (and translation submenu), tagging it with the record
	 * getter so click handlers can resolve the current message.
	 * @param {Function} getRecord
	 * @return {Object} Menu config.
	 */
	buildAIMenu: function(getRecord)
	{
		var client = Zarafa.plugins.ai.AIClient;
		var items = [];

		if (client.isFeatureEnabled('summarize')) {
			items.push({
				text: _('Summarize'),
				iconCls: 'icon_ai',
				feature: 'summarize',
				aiOpts: { scope: 'single' }
			}, {
				text: _('Summarize thread'),
				iconCls: 'icon_ai',
				feature: 'summarize',
				aiOpts: { scope: 'thread' }
			});
		}

		if (client.isFeatureEnabled('translate')) {
			items.push({
				text: _('Translate'),
				iconCls: 'icon_ai',
				menu: {
					xtype: 'menu',
					getRecord: getRecord,
					listeners: { click: this.onAIMenuClick, scope: this },
					items: this.buildTranslateItems()
				}
			});
		}

		if (client.isFeatureEnabled('actions') && client.anyActionEnabled()) {
			if (items.length > 0) {
				items.push({ xtype: 'menuseparator' });
			}
			items.push({
				text: _('Suggest actions'),
				iconCls: 'icon_ai',
				feature: 'suggest_actions'
			});
		}

		if (items.length === 0) {
			items.push({ text: _('No AI features enabled'), disabled: true });
		}

		return {
			xtype: 'menu',
			getRecord: getRecord,
			listeners: { click: this.onAIMenuClick, scope: this },
			items: items
		};
	},

	/**
	 * Build the target-language items for the translate submenu.
	 * @return {Array}
	 */
	buildTranslateItems: function()
	{
		var targets = [
			['', _('My language')],
			['English', _('English')],
			['German', _('German')],
			['French', _('French')],
			['Spanish', _('Spanish')],
			['Italian', _('Italian')],
			['Dutch', _('Dutch')],
			['Portuguese', _('Portuguese')],
			['Polish', _('Polish')],
			['Chinese', _('Chinese')],
			['Japanese', _('Japanese')]
		];

		return targets.map(function(target) {
			return {
				text: target[1],
				feature: 'translate',
				aiOpts: { target: target[0] }
			};
		});
	},

	/**
	 * Handle a click on an AI menu (or submenu) item.
	 * @param {Ext.menu.Menu} menu
	 * @param {Ext.menu.Item} item
	 */
	onAIMenuClick: function(menu, item)
	{
		if (!item || !item.feature) {
			return;
		}
		var record = menu.getRecord ? menu.getRecord() : null;
		if (!record) {
			Ext.MessageBox.alert(_('AI Assistant'), _('Please open or select a message first.'));
			return;
		}
		if (item.feature === 'suggest_actions') {
			this.runSuggestActions(record);
		} else {
			this.runFeature(item.feature, record, item.aiOpts || {});
		}
	},

	/**
	 * Request and present confirm-first smart actions for a message.
	 * @param {Zarafa.core.data.IPMRecord} record
	 */
	runSuggestActions: function(record)
	{
		var client = Zarafa.plugins.ai.AIClient;
		Zarafa.plugins.ai.ui.AIAssistantWindow.showFeature({
			title: _('Suggested actions'),
			model: client.getModelName(),
			runner: function(panel, win) {
				panel.startLoading(_('Looking for actions…'));
				client.suggestActions(record, panel, win);
			}
		});
	},

	/**
	 * Build the right-click context-menu items.
	 * @param {String} insertionPoint
	 * @param {Zarafa.mail.ui.MailGridContextMenu} contextMenu
	 * @return {Array|undefined}
	 */
	createContextMenuItems: function(insertionPoint, contextMenu)
	{
		var client = Zarafa.plugins.ai.AIClient;
		if (!client.isPluginEnabled()) {
			return undefined;
		}

		var getRecord = function() {
			var records = contextMenu ? contextMenu.records : null;
			return (records && records.length) ? records[0] : null;
		};

		var items = [];
		if (client.isFeatureEnabled('summarize')) {
			items.push({
				xtype: 'zarafa.conditionalitem',
				text: _('Summarize with AI'),
				iconCls: 'icon_ai',
				scope: this,
				handler: function() {
					var record = getRecord();
					if (record) {
						this.runFeature('summarize', record, { scope: 'single' });
					}
				}
			});
		}
		if (client.isFeatureEnabled('translate')) {
			items.push({
				xtype: 'zarafa.conditionalitem',
				text: _('Translate with AI'),
				iconCls: 'icon_ai',
				scope: this,
				handler: function() {
					var record = getRecord();
					if (record) {
						this.runFeature('translate', record, {});
					}
				}
			});
		}

		return items.length ? items : undefined;
	},

	/**
	 * Run a reading-side feature for a record in the shared assistant window.
	 * @param {String} feature
	 * @param {Zarafa.core.data.IPMRecord} record
	 * @param {Object} opts
	 */
	runFeature: function(feature, record, opts)
	{
		opts = opts || {};
		var client = Zarafa.plugins.ai.AIClient;
		var requestOpts = {};
		var title;

		if (feature === 'summarize') {
			requestOpts.scope = opts.scope === 'thread' ? 'thread' : 'single';
			requestOpts.length = client.getSetting('summary_length', 'standard');
			var language = client.uiLanguageName();
			if (language) {
				requestOpts.language = language;
			}
			title = requestOpts.scope === 'thread' ? _('Thread summary') : _('Summary');
		} else if (feature === 'translate') {
			requestOpts.target = opts.target ? opts.target : client.translateTarget();
			title = _('Translation') + ' · ' + requestOpts.target;
		} else {
			title = _('AI Assistant');
		}

		Zarafa.plugins.ai.ui.AIAssistantWindow.showFeature({
			title: title,
			model: client.getModelName(),
			runner: function(panel) {
				panel.startLoading();
				client.run(feature, record, requestOpts, panel);
			}
		});
	},

	/**
	 * Create the settings category for the plugin.
	 * @return {Object} Settings category config.
	 */
	createSettingsCategory: function()
	{
		return {
			xtype: 'zarafa.settingsaicategory',
			settingsContext: arguments[2]
		};
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name: 'ai',
		displayName: _('AI Assistant'),
		pluginConstructor: Zarafa.plugins.ai.AIPlugin
	}));
});
