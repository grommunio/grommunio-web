Ext.namespace('Zarafa.plugins.ai.ui');

/**
 * @class Zarafa.plugins.ai.ui.AIAssistantPanel
 * @extends Ext.Panel
 * @xtype zarafa.aiassistantpanel
 *
 * The body of the AI Assistant window: a scrollable area that renders the
 * assistant's output. It supports incremental streaming (appendDelta) as well
 * as a single buffered result (setResult), plus loading and error states.
 */
Zarafa.plugins.ai.ui.AIAssistantPanel = Ext.extend(Ext.Panel, {

	/**
	 * @property {String} accumulated text of the current response.
	 * @private
	 */
	text: '',

	/**
	 * @property {String} pending HTML to apply once the panel is rendered.
	 * @private
	 */
	pendingHtml: null,

	constructor: function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			border: false,
			autoScroll: true,
			cls: 'k-ai-body',
			html: '<div class="k-ai-content"></div><div class="k-ai-chips" style="display:none"></div>'
		});

		this.addEvents(
			/**
			 * @event airesult Fired when a full result is available.
			 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
			 * @param {String} text
			 */
			'airesult',
			/**
			 * @event aierror Fired when the request failed.
			 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
			 * @param {String} message
			 */
			'aierror',
			/**
			 * @event chipclick Fired when a suggested-action chip is clicked.
			 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
			 * @param {Number} index The chip's index.
			 */
			'chipclick'
		);

		Zarafa.plugins.ai.ui.AIAssistantPanel.superclass.constructor.call(this, config);

		this.on('afterrender', this.onAfterRender, this);
	},

	/**
	 * Apply any HTML produced before the panel was rendered and wire chip clicks.
	 * @private
	 */
	onAfterRender: function()
	{
		if (this.pendingHtml !== null) {
			this.writeHtml(this.pendingHtml);
			this.pendingHtml = null;
		}
		this.body.on('click', this.onBodyClick, this);
	},

	/**
	 * Delegate clicks on chips to a 'chipclick' event carrying the chip index.
	 * @param {Ext.EventObject} event
	 * @private
	 */
	onBodyClick: function(event)
	{
		var chip = event.getTarget('.k-ai-chip');
		if (chip) {
			this.fireEvent('chipclick', this, parseInt(chip.getAttribute('data-idx'), 10));
		}
	},

	/**
	 * Render suggested-action chips below the content and reveal them.
	 * @param {String} html
	 */
	setChips: function(html)
	{
		var el = this.rendered && this.body ? this.body.child('.k-ai-chips', true) : null;
		if (el) {
			el.innerHTML = html;
			el.style.display = '';
		}
	},

	/**
	 * Clear and hide the chips area.
	 */
	clearChips: function()
	{
		var el = this.rendered && this.body ? this.body.child('.k-ai-chips', true) : null;
		if (el) {
			el.innerHTML = '';
			el.style.display = 'none';
		}
	},

	/**
	 * Enter the loading state.
	 * @param {String} label Optional status text.
	 */
	startLoading: function(label)
	{
		this.text = '';
		this.writeHtml('<div class="k-ai-status"><span class="k-ai-spinner"></span>' +
			Ext.util.Format.htmlEncode(label || _('Thinking…')) + '</div>');
	},

	/**
	 * Append a streamed text fragment and re-render with a caret.
	 * @param {String} delta
	 */
	appendDelta: function(delta)
	{
		if (!delta) {
			return;
		}
		this.text += delta;
		this.renderText(true);
	},

	/**
	 * Set the full result text and re-render without a caret.
	 * @param {String} text
	 */
	setResult: function(text)
	{
		this.text = text || '';
		this.renderText(false);
		this.fireEvent('airesult', this, this.text);
	},

	/**
	 * Show an error message.
	 * @param {String} message
	 */
	setError: function(message)
	{
		this.writeHtml('<div class="k-ai-error">' + Ext.util.Format.htmlEncode(message) + '</div>');
		this.fireEvent('aierror', this, message);
	},

	/**
	 * Append a notice that the streamed response was cut off and may be
	 * incomplete, without discarding the text already shown.
	 */
	markInterrupted: function()
	{
		var contentEl = this.rendered && this.body ? this.body.child('.k-ai-content', true) : null;
		if (contentEl) {
			contentEl.innerHTML += '<div class="k-ai-note">' +
				Ext.util.Format.htmlEncode(_('The response was interrupted and may be incomplete.')) + '</div>';
		}
	},

	/**
	 * @return {String} The current text.
	 */
	getText: function()
	{
		return this.text;
	},

	/**
	 * Render the accumulated text as HTML, optionally with a streaming caret,
	 * and keep the view scrolled to the bottom.
	 * @param {Boolean} withCaret
	 * @private
	 */
	renderText: function(withCaret)
	{
		var html = Zarafa.plugins.ai.ui.AIAssistantPanel.renderMarkdown(this.text);
		if (withCaret) {
			html += '<span class="k-ai-caret"></span>';
		}
		this.writeHtml(html);

		if (this.rendered && this.body) {
			var dom = this.body.dom;
			dom.scrollTop = dom.scrollHeight;
		}
	},

	/**
	 * Write HTML into the content element, deferring until rendered.
	 * @param {String} html
	 * @private
	 */
	writeHtml: function(html)
	{
		if (!this.rendered || !this.body) {
			this.pendingHtml = html;
			return;
		}
		var contentEl = this.body.child('.k-ai-content', true);
		if (contentEl) {
			contentEl.innerHTML = html;
		}
	}
});

Ext.reg('zarafa.aiassistantpanel', Zarafa.plugins.ai.ui.AIAssistantPanel);

/**
 * Render a safe subset of Markdown (paragraphs, '-'/'*' bullets, #/##/###
 * headings, **bold**, `code`) to HTML. Input is HTML-escaped first, so model
 * output can never inject markup.
 *
 * @param {String} text
 * @return {String} HTML
 * @static
 */
Zarafa.plugins.ai.ui.AIAssistantPanel.renderMarkdown = function(text)
{
	text = String(text || '');

	var inline = function(value) {
		// Decode entities the model emitted (e.g. &nbsp;) to real characters,
		// then re-escape so display is both correct and injection-safe.
		value = Ext.util.Format.htmlEncode(Zarafa.plugins.ai.AIClient.decodeEntities(value));
		value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
		value = value.replace(/`([^`]+)`/g, '<code>$1</code>');
		return value;
	};

	var lines = text.replace(/\r\n?/g, '\n').split('\n');
	var html = [];
	var i = 0;

	while (i < lines.length) {
		var line = lines[i];

		if ((/^\s*$/).test(line)) {
			i++;
			continue;
		}

		var heading = line.match(/^(#{1,6})\s+(.*)$/);
		if (heading) {
			html.push('<h3>' + inline(heading[2]) + '</h3>');
			i++;
			continue;
		}

		if ((/^\s*[-*+]\s+/).test(line)) {
			html.push('<ul>');
			while (i < lines.length && (/^\s*[-*+]\s+/).test(lines[i])) {
				html.push('<li>' + inline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>');
				i++;
			}
			html.push('</ul>');
			continue;
		}

		if ((/^\s*\d+[.)]\s+/).test(line)) {
			html.push('<ol>');
			while (i < lines.length && (/^\s*\d+[.)]\s+/).test(lines[i])) {
				html.push('<li>' + inline(lines[i].replace(/^\s*\d+[.)]\s+/, '')) + '</li>');
				i++;
			}
			html.push('</ol>');
			continue;
		}

		var para = [];
		while (i < lines.length &&
			!(/^\s*$/).test(lines[i]) &&
			!(/^\s*[-*+]\s+/).test(lines[i]) &&
			!(/^\s*\d+[.)]\s+/).test(lines[i]) &&
			!(/^#{1,6}\s+/).test(lines[i])) {
			para.push(inline(lines[i]));
			i++;
		}
		html.push('<p>' + para.join('<br/>') + '</p>');
	}

	return html.join('');
};
