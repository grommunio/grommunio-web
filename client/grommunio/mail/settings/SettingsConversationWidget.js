/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.settings');

/**
 * @class Grommunio.mail.settings.SettingsConversationWidget
 * @extends Grommunio.settings.ui.SettingsWidget
 * @xtype grommunio.settingsconversationwidget
 *
 * The {@link Grommunio.settings.ui.SettingsWidget widget} for configuring
 * the general mail options in the {@link Grommunio.mail.settings.SettingsMailCategory mail category}.
 */
Grommunio.mail.settings.SettingsConversationWidget = Ext.extend(Grommunio.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Conversation view settings'),
			layout: 'form',
			items: [{
				xtype: 'checkbox',
				name: 'grommunio/v1/contexts/mail/enable_conversation_view',
				ref: 'enableConversations',
				boxLabel: _('Enable conversation view'),
				hideLabel: true,
				lazyInit: false,
				handler: this.onClickEnableConversationsHandler,
				scope: this,
				listeners: {
					check: this.onCheck,
					scope: this
				}
			},{
				xtype: 'checkbox',
				name: 'grommunio/v1/contexts/mail/expand_single_conversation',
				boxLabel: _('Collapse conversation when selecting a different email'),
				hideLabel: true,
				ref: 'singleExpand',
				lazyInit: false,
				listeners: {
					check: this.onCheck,
					scope: this
				}
			},{
				xtype: 'checkbox',
				name: 'grommunio/v1/contexts/mail/enable_conversation_preview',
				boxLabel: _('Show the entire conversation in the reading pane'),
				hideLabel: true,
				ref: 'conversationPreview',
				lazyInit: false,
				listeners: {
					check: this.onCheck,
					scope: this
				}
			}]
		});

		Grommunio.mail.settings.SettingsConversationWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Grommunio.settings.SettingsModel} into the UI of this category.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;

		var enableConversations = settingsModel.get(this.enableConversations.name);
		this.enableConversations.setValue(enableConversations);
		this.singleExpand.setValue(settingsModel.get(this.singleExpand.name));
		this.singleExpand.setDisabled(!enableConversations);
		this.conversationPreview.setValue(settingsModel.get(this.conversationPreview.name, true) !== false);
		this.conversationPreview.setDisabled(!enableConversations);
	},

	/**
	 * Called by the {@link Grommunio.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link grommunio.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Grommunio.settings.SettingsModel settings model}.
	 * @param {Grommunio.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
	{
		settingsModel.set(this.enableConversations.name, this.enableConversations.getValue());
		settingsModel.set(this.singleExpand.name, this.singleExpand.getValue());
		settingsModel.set(this.conversationPreview.name, this.conversationPreview.getValue());
	},

	/**
	 * Event handler called when checkbox has been modified
	 *
	 * @param {Ext.form.CheckBox} checkbox Checkbox element from which the event originated
	 * @param {Boolean} checked State of the checkbox
	 * @private
	 */
	onCheck: function(checkbox, checked)
	{
		if(this.model) {
			// FIXME: The settings model should be able to detect if
			// a change was applied
			if (this.model.get(checkbox.name) !== checked) {
				this.model.set(checkbox.name, checked);
				// The mail grid and store wire up the conversation view when they
				// are created, so switching those settings requires a reload. The
				// reading pane setting is evaluated on the fly.
				if (checkbox !== this.conversationPreview) {
					this.model.requiresReload = true;
				}
			}
		}
	},

	/**
	 * Handler can uncheck and disable the {@link #singleExpand Expand single conversation} checkbox if
	 * {@link #enableConversations Enable conversation view} checkbox is unchecked and if it is checked
	 * then enable the {@link #singleExpand Expand single conversation} checkbox and check/uncheck the
	 * checkbox based on user settings.
	 *
	 * @param {Ext.form.CheckBox} checkbox The Enable conversation view checkbox element from which the event originated
	 * @param {Boolean} checked State of the checkbox
	 */
	onClickEnableConversationsHandler: function(checkbox, checked)
	{
		this.singleExpand.setDisabled(!checked);
	}
});

Ext.reg('grommunio.settingsconversationwidget', Grommunio.mail.settings.SettingsConversationWidget);
