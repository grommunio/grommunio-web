Ext.namespace('Zarafa.plugins.ai.ui');

/**
 * @class Zarafa.plugins.ai.ui.AIAssistantWindow
 * @extends Ext.Window
 * @xtype zarafa.aiassistantwindow
 *
 * A floating, resizable card that hosts the {@link Zarafa.plugins.ai.ui.AIAssistantPanel}
 * and a footer toolbar. Reading-side features (summarize, translate, suggested
 * actions) run inside this window so the user keeps their place in the mail.
 *
 * A single instance is reused across invocations via {@link #showFeature}.
 */
Zarafa.plugins.ai.ui.AIAssistantWindow = Ext.extend(Ext.Window, {

	/**
	 * @property {Zarafa.plugins.ai.ui.AIAssistantPanel} the content panel.
	 */
	aiPanel: undefined,

	/**
	 * @property {Function} the current runner; re-invoked by Regenerate.
	 * @private
	 */
	runner: undefined,

	/**
	 * @property {Boolean} whether the window has been positioned once.
	 * @private
	 */
	positioned: false,

	constructor: function(config)
	{
		config = config || {};

		this.aiPanel = new Zarafa.plugins.ai.ui.AIAssistantPanel();

		Ext.applyIf(config, {
			title: _('AI Assistant'),
			cls: 'k-ai-window',
			width: 560,
			height: 460,
			minWidth: 420,
			minHeight: 260,
			closeAction: 'hide',
			constrainHeader: true,
			layout: 'fit',
			items: this.aiPanel,
			buttonAlign: 'left',
			buttons: this.createButtons()
		});

		Zarafa.plugins.ai.ui.AIAssistantWindow.superclass.constructor.call(this, config);

		this.aiPanel.on('chipclick', this.onChipClick, this);
	},

	/**
	 * Build the footer buttons. Insert/Replace are created hidden and shown
	 * only when a feature provides insert/replace handlers (compose).
	 * @return {Array}
	 * @private
	 */
	createButtons: function()
	{
		this.insertBtn = new Ext.Button({
			text: _('Insert at cursor'),
			hidden: true,
			scope: this,
			handler: this.onInsert
		});
		this.replaceBtn = new Ext.Button({
			text: _('Replace draft'),
			iconCls: 'icon_pencil',
			hidden: true,
			scope: this,
			handler: this.onReplace
		});
		this.copyBtn = new Ext.Button({
			text: _('Copy'),
			iconCls: 'icon_copy',
			scope: this,
			handler: this.onCopy
		});
		this.regenerateBtn = new Ext.Button({
			text: _('Regenerate'),
			scope: this,
			handler: this.onRegenerate
		});

		return [this.insertBtn, this.replaceBtn, this.copyBtn, '->', this.regenerateBtn, {
			text: _('Close'),
			scope: this,
			handler: function() {
				this.hide();
			}
		}];
	},

	/**
	 * Start a feature run: show the window, set its title, clear chips, store
	 * the runner for Regenerate, and execute it against the panel.
	 *
	 * @param {Object} options title {String}, model {String}, runner {Function}
	 */
	startFeature: function(options)
	{
		options = options || {};
		this.runner = options.runner;
		this.insertHandler = options.onInsert || null;
		this.replaceHandler = options.onReplace || null;

		if (this.insertBtn) {
			this.insertBtn.setVisible(!!this.insertHandler);
			this.insertBtn.setText(options.insertLabel || _('Insert at cursor'));
			// Optional icon per feature (e.g. a reply icon for "Open as reply").
			if (Ext.isFunction(this.insertBtn.setIconClass)) {
				this.insertBtn.setIconClass(options.insertIconCls || '');
			}
		}
		if (this.replaceBtn) {
			this.replaceBtn.setVisible(!!this.replaceHandler);
			this.replaceBtn.setText(options.replaceLabel || _('Replace draft'));
		}

		var title = options.title || _('AI Assistant');
		if (options.model) {
			title += ' · ' + options.model;
		}
		this.setTitle(Ext.util.Format.htmlEncode(title));

		this.clearChips();

		if (!this.isVisible()) {
			this.show();
		}
		if (!this.positioned) {
			this.center();
			this.positioned = true;
		}
		this.toFront();

		if (Ext.isFunction(this.runner)) {
			this.runner(this.aiPanel, this);
		}
	},

	/**
	 * Copy the current result to the clipboard, with brief button feedback.
	 * @param {Ext.Button} button
	 * @private
	 */
	onCopy: function(button)
	{
		var text = this.aiPanel.getText();
		if (!text) {
			return;
		}

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text);
		} else {
			var textarea = document.createElement('textarea');
			textarea.value = text;
			document.body.appendChild(textarea);
			textarea.select();
			try {
				document.execCommand('copy');
			} catch (e) {
				// Ignore: clipboard may be unavailable.
			}
			document.body.removeChild(textarea);
		}

		var original = button.text;
		button.setText(_('Copied'));
		(function() {
			if (button && !button.isDestroyed) {
				button.setText(original);
			}
		}).defer(1500);
	},

	/**
	 * Re-run the current feature.
	 * @private
	 */
	onRegenerate: function()
	{
		if (Ext.isFunction(this.runner)) {
			// Clear any chips from the previous run so they cannot be clicked while
			// the regenerate is loading or after it errors (startFeature does this
			// for a fresh run; Regenerate re-invokes the runner directly).
			this.clearChips();
			this.runner(this.aiPanel, this);
		}
	},

	/**
	 * Insert the result into the composer at the cursor and close.
	 * @private
	 */
	onInsert: function()
	{
		var text = this.aiPanel.getText();
		if (text && Ext.isFunction(this.insertHandler)) {
			// A handler may return false to signal it could not apply the text
			// (e.g. the target editor is gone); keep the window open in that case.
			if (this.insertHandler(text) !== false) {
				this.hide();
			}
		}
	},

	/**
	 * Replace the composer draft with the result and close.
	 * @private
	 */
	onReplace: function()
	{
		var text = this.aiPanel.getText();
		if (text && Ext.isFunction(this.replaceHandler)) {
			if (this.replaceHandler(text) !== false) {
				this.hide();
			}
		}
	},

	/**
	 * Render suggested-action chips inside the panel and reveal them.
	 * @param {Array} actions Sanitized action objects.
	 * @param {Zarafa.core.data.IPMRecord} record The source mail record.
	 */
	setChips: function(actions, record)
	{
		this.chipsActions = actions || [];
		this.chipsRecord = record;
		this.aiPanel.setChips(Zarafa.plugins.ai.ui.AIActionChips.renderHtml(this.chipsActions));
	},

	/**
	 * Execute the action behind a clicked chip (opens a confirm-first dialog).
	 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
	 * @param {Number} index
	 * @private
	 */
	onChipClick: function(panel, index)
	{
		var action = this.chipsActions && this.chipsActions[index];
		if (action) {
			Zarafa.plugins.ai.SmartActions.execute(action, this.chipsRecord);
		}
	},

	/**
	 * Remove all suggested-action chips.
	 */
	clearChips: function()
	{
		this.chipsActions = [];
		this.aiPanel.clearChips();
	}
});

Ext.reg('zarafa.aiassistantwindow', Zarafa.plugins.ai.ui.AIAssistantWindow);

/**
 * Show the shared AI Assistant window and start a feature in it.
 *
 * @param {Object} options title {String}, model {String}, runner {Function}
 * @return {Zarafa.plugins.ai.ui.AIAssistantWindow}
 * @static
 */
Zarafa.plugins.ai.ui.AIAssistantWindow.showFeature = function(options)
{
	var instance = Zarafa.plugins.ai.ui.AIAssistantWindow.instance;
	if (!instance || instance.isDestroyed) {
		instance = new Zarafa.plugins.ai.ui.AIAssistantWindow();
		Zarafa.plugins.ai.ui.AIAssistantWindow.instance = instance;
	}
	instance.startFeature(options);
	return instance;
};
