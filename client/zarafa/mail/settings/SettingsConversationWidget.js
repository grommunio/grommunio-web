Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsConversationWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsconversationwidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for configuring
 * the general mail options in the {@link Zarafa.mail.settings.SettingsMailCategory mail category}.
 */
Zarafa.mail.settings.SettingsConversationWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

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
				name: 'zarafa/v1/contexts/mail/enable_conversation_view',
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
				name: 'zarafa/v1/contexts/mail/expand_single_conversation',
				boxLabel: _('Collapse conversation when selecting a different email'),
				hideLabel: true,
				ref: 'singleExpand',
				lazyInit: false,
				listeners: {
					check: this.onCheck,
					scope: this
				}
			}]
		});

		Zarafa.mail.settings.SettingsConversationWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#update}.
	 * This is used to load the latest version of the settings from the
	 * {@link Zarafa.settings.SettingsModel} into the UI of this category.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to load
	 */
	update: function(settingsModel)
	{
		this.model = settingsModel;

		var enableConversations = settingsModel.get(this.enableConversations.name);
		this.enableConversations.setValue(enableConversations);
		this.singleExpand.setValue(settingsModel.get(this.singleExpand.name));
		this.singleExpand.setDisabled(!enableConversations);
	},

	/**
	 * Called by the {@link Zarafa.settings.ui.SettingsCategory Category} when
	 * it has been called with {@link zarafa.settings.ui.SettingsCategory#updateSettings}.
	 * This is used to update the settings from the UI into the {@link Zarafa.settings.SettingsModel settings model}.
	 * @param {Zarafa.settings.SettingsModel} settingsModel The settings to update
	 */
	updateSettings: function(settingsModel)
	{
		settingsModel.set(this.enableConversations.name, this.enableConversations.getValue());
		settingsModel.set(this.singleExpand.name, this.singleExpand.getValue());
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

Ext.reg('zarafa.settingsconversationwidget', Zarafa.mail.settings.SettingsConversationWidget);
