Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsSafeSenderCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingssafesendercategory
 *
 * The category for configuring sender lists (safe senders, safe recipients,
 * blocked senders) stored in the Outlook-compatible Junk Email Rule FAI message.
 */
Zarafa.mail.settings.SettingsSafeSenderCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {

	/**
	 * @insert context.settings.category.safesender
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.mail.settings.SettingsSafeSenderCategory Sender Lists Category}.
	 * @param {Zarafa.mail.settings.SettingsSafeSenderCategory} category The Sender Lists
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('Sender Lists'),
			categoryIndex: 8,
			iconCls: 'zarafa-settings-category-safesenders',
			items: [{
				xtype: 'zarafa.settingssafesenderswidget',
				settingsContext: config.settingsContext
			},{
				xtype: 'zarafa.settingssaferecipientswidget',
				settingsContext: config.settingsContext
			},{
				xtype: 'zarafa.settingsblockedsenderswidget',
				settingsContext: config.settingsContext
			},{
				xtype: 'zarafa.settingssenderlistsoptionswidget',
				settingsContext: config.settingsContext
			},
				container.populateInsertionPoint('context.settings.category.safesender', this)
			]
		});

		Zarafa.mail.settings.SettingsSafeSenderCategory.superclass.constructor.call(this, config);

		// Start from fresh lists whenever the category is opened. Another
		// client may have edited the same rule since login.
		this.on('activate', function() {
			Zarafa.mail.data.JunkMailStore.load();
		}, this);
	},

	/**
	 * Event handler for the
	 * {@link Zarafa.settings.SettingsContextModel ContextModel}#{@link Zarafa.settings.SettingsContextModel#beforesavesettings beforesavesettings}
	 * event. It hooks into the save flow to also persist JunkMailStore to server.
	 * @private
	 */
	onBeforeSaveSettingsModel: function()
	{
		Zarafa.mail.settings.SettingsSafeSenderCategory.superclass.onBeforeSaveSettingsModel.apply(this, arguments);

		this.displaySavingMask();
		Zarafa.mail.data.JunkMailStore.save(function(success) {
			this.hideSavingMask(success);
		}, this);
	}
});

Ext.reg('zarafa.settingssafesendercategory', Zarafa.mail.settings.SettingsSafeSenderCategory);
