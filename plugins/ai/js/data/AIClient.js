Ext.namespace('Zarafa.plugins.ai');

/**
 * @class Zarafa.plugins.ai.AIClient
 * @singleton
 *
 * Central helper for talking to the server-side AI module. Owns the settings
 * lookups (which features/actions are available), the UI-language mapping, and
 * the request payload construction. The API key lives only on the server, so
 * nothing secret passes through here.
 */
Zarafa.plugins.ai.AIClient = {

	/**
	 * @property {String} MODULE The server module name.
	 */
	MODULE: 'pluginaimodule',

	/**
	 * Read a plugin setting.
	 * @param {String} key Key below zarafa/v1/plugins/ai/.
	 * @param {Mixed} defaultValue Returned when unset.
	 * @return {Mixed}
	 */
	getSetting: function(key, defaultValue)
	{
		var value = container.getSettingsModel().get('zarafa/v1/plugins/ai/' + key, true);
		return Ext.isDefined(value) ? value : defaultValue;
	},

	/**
	 * The key-free server info injected at login (provider, model, features).
	 * @return {Object}
	 */
	getServerInfo: function()
	{
		return this.getSetting('server', {}) || {};
	},

	/**
	 * The configured model's display name.
	 * @return {String}
	 */
	getModelName: function()
	{
		return this.getServerInfo().model || '';
	},

	/**
	 * Whether the plugin is enabled for the user and configured on the server.
	 * @return {Boolean}
	 */
	isPluginEnabled: function()
	{
		// Opt-in: a missing 'enable' is treated as disabled. 'configured' reflects
		// the administrator's master switch (PLUGIN_AI_ENABLE) plus a usable
		// provider, so the assistant only appears once the admin has unlocked it.
		return this.getSetting('enable', false) === true && this.getServerInfo().configured === true;
	},

	/**
	 * Whether a feature is usable: enabled by the admin and not turned off by
	 * the user.
	 * @param {String} feature summarize | translate | compose | actions
	 * @return {Boolean}
	 */
	isFeatureEnabled: function(feature)
	{
		if (!this.isPluginEnabled()) {
			return false;
		}
		var serverFeatures = this.getServerInfo().features || {};
		if (serverFeatures[feature] === false) {
			return false;
		}
		return this.getSetting('feature_' + feature, true) !== false;
	},

	/**
	 * Whether a smart action is usable (admin enabled and user enabled).
	 * @param {String} action meeting | task | contact | reply
	 * @return {Boolean}
	 */
	isActionEnabled: function(action)
	{
		if (!this.isFeatureEnabled('actions')) {
			return false;
		}
		var serverActions = this.getServerInfo().actions || {};
		if (serverActions[action] === false) {
			return false;
		}
		return this.getSetting('action_' + action, true) !== false;
	},

	/**
	 * Whether any smart action at all is usable.
	 * @return {Boolean}
	 */
	anyActionEnabled: function()
	{
		return this.isActionEnabled('meeting') || this.isActionEnabled('task') ||
			this.isActionEnabled('contact') || this.isActionEnabled('reply');
	},

	/**
	 * Whether token streaming should be attempted.
	 * @return {Boolean}
	 */
	isStreamingEnabled: function()
	{
		if (this.getServerInfo().streaming === false) {
			return false;
		}
		return this.getSetting('streaming', true) !== false;
	},

	/**
	 * The English name of the user's UI language, or '' if unknown.
	 * @return {String}
	 */
	uiLanguageName: function()
	{
		var lang = container.getSettingsModel().get('zarafa/v1/main/language') || '';
		return this.codeToLanguage(lang);
	},

	/**
	 * The effective translation target: the user's configured target, or their
	 * UI language when set to 'auto'.
	 * @return {String}
	 */
	translateTarget: function()
	{
		var target = this.getSetting('translate_target', 'auto');
		if (!target || target === 'auto') {
			return this.uiLanguageName() || 'English';
		}
		return target;
	},

	/**
	 * Map a locale code (e.g. 'de_DE.UTF-8') to an English language name.
	 * @param {String} code
	 * @return {String}
	 */
	codeToLanguage: function(code)
	{
		if (!code) {
			return '';
		}
		var key = code.toLowerCase().split('.')[0].split('_')[0];
		var map = {
			en: 'English', de: 'German', fr: 'French', es: 'Spanish', it: 'Italian',
			nl: 'Dutch', pt: 'Portuguese', pl: 'Polish', ru: 'Russian', cs: 'Czech',
			sk: 'Slovak', hu: 'Hungarian', tr: 'Turkish', zh: 'Chinese', ja: 'Japanese',
			ko: 'Korean', ar: 'Arabic', uk: 'Ukrainian', sv: 'Swedish', da: 'Danish',
			fi: 'Finnish', nb: 'Norwegian', no: 'Norwegian', el: 'Greek', ro: 'Romanian',
			bg: 'Bulgarian', hr: 'Croatian', sl: 'Slovenian', sr: 'Serbian', et: 'Estonian',
			lv: 'Latvian', lt: 'Lithuanian', he: 'Hebrew', hi: 'Hindi', th: 'Thai',
			vi: 'Vietnamese', id: 'Indonesian', fa: 'Persian', ca: 'Catalan'
		};
		return map[key] || '';
	},

	/**
	 * Convert AI plain-text output into HTML suitable for the rich mail editor.
	 * Unlike HTMLParser.convertPlainToHTML (which wraps text in a <pre>, forcing
	 * a monospace font), this produces normal paragraphs that inherit the
	 * editor's default font. Blank lines become paragraph breaks; single line
	 * breaks become <br>.
	 * @param {String} text
	 * @return {String} HTML
	 */
	toEditorHtml: function(text)
	{
		// Decode any HTML entities the model emitted (e.g. &nbsp;) so they don't
		// show up literally, then escape for safety, then preserve every line
		// break as <br> (keeps the original spacing; no <pre>, so the editor's
		// default font is used).
		var decoded = this.decodeEntities(String(text || ''));
		var escaped = Ext.util.Format.htmlEncode(decoded);
		return escaped.replace(/\r\n?/g, '\n').replace(/\n/g, '<br />');
	},

	/**
	 * Decode HTML entities (named/numeric) in a string to their characters.
	 * Used so model output like "&nbsp;" or "&amp;" is shown as the real
	 * character instead of the literal entity. Safe: a detached <textarea>
	 * decodes entities without executing markup.
	 * @param {String} text
	 * @return {String}
	 */
	decodeEntities: function(text)
	{
		text = String(text || '');
		if (text.indexOf('&') === -1) {
			return text;
		}
		var textarea = document.createElement('textarea');
		textarea.innerHTML = text;
		return textarea.value;
	},

	/**
	 * Build the request payload identifying a message plus feature options.
	 * @param {Zarafa.core.data.IPMRecord} record
	 * @param {Object} opts Extra fields (scope, length, target, language).
	 * @return {Object}
	 */
	payloadFor: function(record, opts)
	{
		return Ext.apply({
			entryid: record.get('entryid'),
			parent_entryid: record.get('parent_entryid'),
			store_entryid: record.get('store_entryid')
		}, opts || {});
	},

	/**
	 * Run a feature against a message, delivering output into the given panel.
	 * @param {String} feature
	 * @param {Zarafa.core.data.IPMRecord} record
	 * @param {Object} opts Request options.
	 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
	 */
	run: function(feature, record, opts, panel)
	{
		var data = this.payloadFor(record, opts);
		if (this.isStreamingEnabled() && typeof window.fetch === 'function' && window.ReadableStream) {
			this.streamRequest(feature, data, panel);
		} else {
			this.moduleRequest(feature, data, panel);
		}
	},

	/**
	 * Run the compose feature on draft text (no stored message involved).
	 * @param {Object} opts operation, text, tone/target
	 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
	 */
	runCompose: function(opts, panel)
	{
		var data = Ext.apply({}, opts);
		if (this.isStreamingEnabled() && typeof window.fetch === 'function' && window.ReadableStream) {
			this.streamRequest('compose', data, panel);
		} else {
			this.moduleRequest('compose', data, panel);
		}
	},

	/**
	 * Request suggested smart actions for a message (always buffered — the
	 * response is structured JSON, not streamed). Renders chips into the window
	 * on success.
	 * @param {Zarafa.core.data.IPMRecord} record
	 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
	 * @param {Zarafa.plugins.ai.ui.AIAssistantWindow} win
	 */
	suggestActions: function(record, panel, win)
	{
		var self = this;
		var data = this.payloadFor(record, { language: this.uiLanguageName() });

		container.getRequest().singleRequest(
			this.MODULE,
			'suggest_actions',
			data,
			new Zarafa.plugins.ai.data.AIResponseHandler({
				successCallback: function(response) {
					var actions = (response && response.actions) || [];
					actions = actions.filter(function(action) {
						return self.isActionEnabled(action.type);
					});
					if (!actions.length) {
						panel.setResult(_('No suggested actions were found for this message.'));
						return;
					}
					panel.setResult(_('Suggested actions — each opens a prefilled dialog you review before saving:'));
					if (win && win.setChips) {
						win.setChips(actions, record);
					}
				},
				errorCallback: function(message) {
					panel.setError(message);
				},
				scope: self
			})
		);
	},

	/**
	 * The relative URL of the streaming endpoint.
	 * @return {String}
	 */
	streamUrl: function()
	{
		return 'plugins/ai/php/stream.php';
	},

	/**
	 * Attempt a streamed request via Server-Sent Events, falling back to the
	 * buffered module path on any transport failure (network error, non-200,
	 * or an empty stream).
	 * @param {String} feature
	 * @param {Object} data Request payload (without feature).
	 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
	 */
	streamRequest: function(feature, data, panel)
	{
		var self = this;
		var state = { gotEvent: false, finalized: false, fellBack: false };

		// Fall back to the buffered path only while nothing has streamed yet.
		var fallback = function() {
			if (state.fellBack || state.gotEvent) {
				return;
			}
			state.fellBack = true;
			self.moduleRequest(feature, data, panel);
		};

		// The stream ended without a 'done'/'error' event — a mid-stream drop.
		// Keep the text already shown, but mark it as possibly incomplete rather
		// than presenting a truncated answer as if it were final.
		var finalize = function() {
			if (!state.finalized) {
				state.finalized = true;
				panel.setResult(panel.getText());
				if (panel.getText()) {
					panel.markInterrupted();
				}
			}
		};

		window.fetch(this.streamUrl(), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(Ext.apply({ feature: feature }, data)),
			credentials: 'same-origin'
		}).then(function(response) {
			if (!response.ok || !response.body || !response.body.getReader) {
				fallback();
				return undefined;
			}

			var reader = response.body.getReader();
			var decoder = new TextDecoder('utf-8');
			var buffer = '';

			var pump = function() {
				return reader.read().then(function(result) {
					if (result.done) {
						if (state.gotEvent) {
							finalize();
						} else {
							fallback();
						}
						return undefined;
					}

					buffer += decoder.decode(result.value, { stream: true });
					var index;
					while ((index = buffer.indexOf('\n\n')) !== -1) {
						self.handleStreamEvent(buffer.substring(0, index), panel, state);
						buffer = buffer.substring(index + 2);
					}
					return pump();
				});
			};

			return pump();
		}).catch(function() {
			// Transport failed: fall back if nothing streamed, else finalize.
			if (state.gotEvent) {
				finalize();
			} else {
				fallback();
			}
		});
	},

	/**
	 * Parse one raw SSE event block and apply it to the panel.
	 * @param {String} raw The text between event boundaries.
	 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
	 * @param {Object} state Streaming state flags.
	 * @private
	 */
	handleStreamEvent: function(raw, panel, state)
	{
		var lines = raw.split('\n');
		var event = 'message';
		var dataStr = '';
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i];
			if (line.indexOf('event:') === 0) {
				event = line.substring(6).trim();
			} else if (line.indexOf('data:') === 0) {
				dataStr += line.substring(5).trim();
			}
		}

		var payload;
		try {
			payload = dataStr ? JSON.parse(dataStr) : {};
		} catch (e) {
			return;
		}

		state.gotEvent = true;
		if (event === 'delta') {
			panel.appendDelta(payload.text || '');
		} else if (event === 'done') {
			panel.setResult(payload.text ? payload.text : panel.getText());
			state.finalized = true;
		} else if (event === 'error') {
			panel.setError(payload.message || _('The AI request failed.'));
			state.finalized = true;
		}
	},

	/**
	 * Perform a buffered (non-streaming) module request.
	 * @param {String} feature
	 * @param {Object} data Request payload.
	 * @param {Zarafa.plugins.ai.ui.AIAssistantPanel} panel
	 */
	moduleRequest: function(feature, data, panel)
	{
		container.getRequest().singleRequest(
			this.MODULE,
			feature,
			data,
			new Zarafa.plugins.ai.data.AIResponseHandler({
				successCallback: function(response) {
					panel.setResult(response.text || '');
				},
				errorCallback: function(message) {
					panel.setError(message);
				},
				scope: this
			})
		);
	}
};
