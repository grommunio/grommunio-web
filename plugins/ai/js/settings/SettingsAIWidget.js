Ext.namespace('Zarafa.plugins.ai.settings');

/**
 * @class Zarafa.plugins.ai.settings.SettingsAIWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsaiwidget
 *
 * User-facing settings for the AI Assistant. The provider, model and API key
 * are configured centrally by the administrator and are NOT editable here; this
 * widget shows the provider status (with a connection test) and the per-user
 * preferences: language, tone, summary length, streaming, and which enabled
 * features and smart actions to use.
 */
Zarafa.plugins.ai.settings.SettingsAIWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @property {Zarafa.settings.SettingsModel} the model being edited.
	 */
	model: undefined,

	constructor: function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			title: _('AI Assistant'),
			layout: { type: 'fit' },
			items: this.createPanelItems()
		});
		Zarafa.plugins.ai.settings.SettingsAIWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Build the form items.
	 * @return {Array}
	 * @private
	 */
	createPanelItems: function()
	{
		var path = 'zarafa/v1/plugins/ai/';

		var lengthStore = new Ext.data.SimpleStore({
			fields: ['value', 'text'],
			data: [['brief', _('Brief')], ['standard', _('Standard')], ['detailed', _('Detailed')]]
		});

		var toneStore = new Ext.data.SimpleStore({
			fields: ['value', 'text'],
			data: [
				['neutral', _('Neutral')], ['formal', _('Formal')], ['friendly', _('Friendly')],
				['confident', _('Confident')], ['concise', _('Concise')], ['casual', _('Casual')]
			]
		});

		var languageData = [['auto', _('My language (automatic)')]];
		['English', 'German', 'French', 'Spanish', 'Italian', 'Dutch', 'Portuguese', 'Polish', 'Russian', 'Chinese', 'Japanese'].forEach(function(language) {
			languageData.push([language, language]);
		});
		var languageStore = new Ext.data.SimpleStore({ fields: ['value', 'text'], data: languageData });

		var comboDefaults = {
			xtype: 'combo',
			mode: 'local',
			triggerAction: 'all',
			editable: false,
			forceSelection: true,
			valueField: 'value',
			displayField: 'text',
			width: 220,
			listeners: { select: this.onComboSelect, scope: this }
		};

		return [{
			xtype: 'form',
			border: false,
			autoHeight: true,
			labelWidth: 220,
			items: [{
				xtype: 'displayfield',
				hideLabel: true,
				cls: 'k-ai-settings-section',
				value: _('Provider')
			}, {
				xtype: 'displayfield',
				ref: '../providerField',
				htmlEncode: false,
				fieldLabel: _('Configured by administrator')
			}, {
				xtype: 'displayfield',
				ref: '../statusField',
				htmlEncode: false,
				fieldLabel: _('Status'),
				value: '&#160;'
			}, {
				xtype: 'button',
				text: _('Test connection'),
				width: 150,
				hideLabel: true,
				ref: '../testBtn',
				handler: this.onTestConnection,
				scope: this,
				style: 'margin-bottom: 10px;'
			}, {
				xtype: 'displayfield',
				hideLabel: true,
				cls: 'k-ai-settings-section',
				value: _('Preferences')
			}, {
				// The plugin-level on/off lives in Settings > Plugins (the
				// framework's canonical control). Duplicating it here would make
				// this whole page vanish the moment it is switched off, so we only
				// point users to it.
				xtype: 'displayfield',
				hideLabel: true,
				cls: 'k-ai-settings-note',
				value: _('You can turn the AI assistant on or off under Settings → Plugins.')
			}, Ext.apply({
				fieldLabel: _('Summary length'),
				name: path + 'summary_length',
				ref: '../summaryLengthCombo',
				store: lengthStore
			}, comboDefaults), Ext.apply({
				fieldLabel: _('Translate into'),
				name: path + 'translate_target',
				ref: '../translateTargetCombo',
				store: languageStore
			}, comboDefaults), Ext.apply({
				fieldLabel: _('Writing tone'),
				name: path + 'compose_tone',
				ref: '../composeToneCombo',
				store: toneStore
			}, comboDefaults), {
				xtype: 'checkbox',
				boxLabel: _('Stream responses as they are generated'),
				name: path + 'streaming',
				hideLabel: true,
				ref: '../streamingCheck',
				listeners: { check: this.onCheck, scope: this }
			}, {
				xtype: 'displayfield',
				hideLabel: true,
				cls: 'k-ai-settings-section',
				value: _('Features')
			},
			this.featureCheck(_('Summarize emails and threads'), path + 'feature_summarize', 'featureSummarize'),
			this.featureCheck(_('Translate emails'), path + 'feature_translate', 'featureTranslate'),
			this.featureCheck(_('Writing assistant in the composer'), path + 'feature_compose', 'featureCompose'),
			this.featureCheck(_('Suggest smart actions'), path + 'feature_actions', 'featureActions'),
			{
				xtype: 'displayfield',
				hideLabel: true,
				cls: 'k-ai-settings-section',
				value: _('Smart actions')
			}, {
				xtype: 'displayfield',
				hideLabel: true,
				cls: 'k-ai-settings-note',
				value: _('Smart actions always open a prefilled dialog for you to review — nothing is saved or sent automatically.')
			},
			this.featureCheck(_('Create meetings and invite attendees'), path + 'action_meeting', 'actionMeeting'),
			this.featureCheck(_('Create tasks'), path + 'action_task', 'actionTask'),
			this.featureCheck(_('Add contacts'), path + 'action_contact', 'actionContact'),
			this.featureCheck(_('Draft replies'), path + 'action_reply', 'actionReply')]
		}];
	},

	/**
	 * Build a checkbox config for a feature/action toggle.
	 * @param {String} label
	 * @param {String} name Full settings path.
	 * @param {String} ref Reference name.
	 * @return {Object}
	 * @private
	 */
	featureCheck: function(label, name, ref)
	{
		return {
			xtype: 'checkbox',
			boxLabel: label,
			name: name,
			hideLabel: true,
			ref: '../' + ref,
			listeners: { check: this.onCheck, scope: this }
		};
	},

	/**
	 * Load the settings into the fields.
	 * @param {Zarafa.settings.SettingsModel} settingsModel
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;
		var client = Zarafa.plugins.ai.AIClient;
		var server = client.getServerInfo();

		// Provider status (read-only, no key).
		if (server.configured) {
			this.providerField.setValue(Ext.util.Format.htmlEncode(
				String.format(_('{0} · model {1}'), server.provider || '', server.model || '')));
		} else {
			this.providerField.setValue('<span class="k-ai-status-dot k-ai-bad"></span>' +
				Ext.util.Format.htmlEncode(server.reason || _('Not configured. Ask your administrator to set up a provider.')));
			this.testBtn.setDisabled(true);
		}

		this.streamingCheck.setValue(settingsModel.get(this.streamingCheck.name) !== false);
		this.summaryLengthCombo.setValue(settingsModel.get(this.summaryLengthCombo.name) || 'standard');
		this.translateTargetCombo.setValue(settingsModel.get(this.translateTargetCombo.name) || 'auto');
		this.composeToneCombo.setValue(settingsModel.get(this.composeToneCombo.name) || 'neutral');

		// Feature toggles, gated by the administrator's master switches.
		var features = server.features || {};
		this.applyToggle(this.featureSummarize, settingsModel, features.summarize);
		this.applyToggle(this.featureTranslate, settingsModel, features.translate);
		this.applyToggle(this.featureCompose, settingsModel, features.compose);
		this.applyToggle(this.featureActions, settingsModel, features.actions);

		// Action toggles, gated by the actions master switch and per-action switch.
		var actions = server.actions || {};
		var actionsAllowed = features.actions !== false;
		this.applyToggle(this.actionMeeting, settingsModel, actionsAllowed && actions.meeting !== false);
		this.applyToggle(this.actionTask, settingsModel, actionsAllowed && actions.task !== false);
		this.applyToggle(this.actionContact, settingsModel, actionsAllowed && actions.contact !== false);
		this.applyToggle(this.actionReply, settingsModel, actionsAllowed && actions.reply !== false);
	},

	/**
	 * Set a toggle's value from settings and disable it when the administrator
	 * has switched the capability off.
	 * @param {Ext.form.Checkbox} checkbox
	 * @param {Zarafa.settings.SettingsModel} settingsModel
	 * @param {Boolean} adminAllowed
	 * @private
	 */
	applyToggle: function(checkbox, settingsModel, adminAllowed)
	{
		var allowed = adminAllowed !== false;
		checkbox.setDisabled(!allowed);
		checkbox.setValue(allowed && settingsModel.get(checkbox.name) !== false);
		// Convey admin-disabled state via a tooltip on the rendered element.
		if (checkbox.rendered && checkbox.wrap) {
			checkbox.wrap.dom.title = allowed ? '' : _('Disabled by administrator');
		}
	},

	/**
	 * Persist field values that are not written immediately on change.
	 * @param {Zarafa.settings.SettingsModel} settingsModel
	 */
	updateSettings: function(settingsModel)
	{
		settingsModel.beginEdit();
		settingsModel.set(this.summaryLengthCombo.name, this.summaryLengthCombo.getValue());
		settingsModel.set(this.translateTargetCombo.name, this.translateTargetCombo.getValue());
		settingsModel.set(this.composeToneCombo.name, this.composeToneCombo.getValue());
		settingsModel.endEdit();
	},

	/**
	 * Apply a checkbox change to the model immediately (so the page is dirty).
	 * @param {Ext.form.Checkbox} checkbox
	 * @param {Boolean} checked
	 * @private
	 */
	onCheck: function(checkbox, checked)
	{
		if (this.model && this.model.get(checkbox.name) !== checked) {
			this.model.set(checkbox.name, checked);
		}
	},

	/**
	 * Apply a combo selection to the model immediately.
	 * @param {Ext.form.ComboBox} combo
	 * @param {Ext.data.Record} record
	 * @private
	 */
	onComboSelect: function(combo, record)
	{
		var value = record.get('value');
		if (this.model && this.model.get(combo.name) !== value) {
			this.model.set(combo.name, value);
		}
	},

	/**
	 * Run a connection test against the configured provider.
	 * @private
	 */
	onTestConnection: function()
	{
		this.statusField.setValue('<span class="k-ai-status-dot"></span>' + Ext.util.Format.htmlEncode(_('Testing…')));

		container.getRequest().singleRequest(
			'pluginaimodule',
			'test_connection',
			{},
			new Zarafa.plugins.ai.data.AIResponseHandler({
				successCallback: function(response) {
					this.statusField.setValue('<span class="k-ai-status-dot k-ai-ok"></span>' +
						Ext.util.Format.htmlEncode(String.format(
							_('Connected to {0} ({1}) — {2} ms'),
							response.provider || '', response.model || '', response.latency_ms || 0)));
				},
				errorCallback: function(message) {
					this.statusField.setValue('<span class="k-ai-status-dot k-ai-bad"></span>' +
						Ext.util.Format.htmlEncode(message));
				},
				scope: this
			})
		);
	}
});

Ext.reg('zarafa.settingsaiwidget', Zarafa.plugins.ai.settings.SettingsAIWidget);
