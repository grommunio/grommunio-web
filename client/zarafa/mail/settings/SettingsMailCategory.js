Ext.namespace('Zarafa.mail.settings');

/**
 * @class Zarafa.mail.settings.SettingsMailCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingsmailcategory
 *
 * The mail category for users which will
 * allow the user to configure Mail related settings
 */
Zarafa.mail.settings.SettingsMailCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.mail
	 * Insertion point to register new {@link Zarafa.settings.ui.SettingsWidget widgets}
	 * for the {@link Zarafa.mail.settings.SettingsMailCategory Mail Category}.
	 * @param {Zarafa.mail.settings.SettingsMailCategory} category The mail
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		var items = [{
				xtype: 'zarafa.settingsmailwidget'
			},{
				xtype: 'zarafa.settingscomposewidget',
				settingsContext: config.settingsContext
			},{
				xtype: 'zarafa.settingswidget',
				title: _('Cc recipients'),
				cls: 'zarafa-settings-widget k-settings-nogap',
				height: 400,
				layout: {
					type: 'fit'
				},
				items: [{
					xtype: 'zarafa.manageccpanel',
					settingsContext: config.settingsContext
				}],
				getCcPanel: function() {
					return this.findByType('zarafa.manageccpanel')[0];
				},
				update: function(settingsModel) {
					var panel = this.getCcPanel();
					if (panel) {
						panel.update(settingsModel);
					}
				},
				updateSettings: function(settingsModel) {
					var panel = this.getCcPanel();
					if (panel) {
						panel.updateSettings(settingsModel);
					}
				}
			},
			container.populateInsertionPoint('context.settings.category.mail.aftercomposesettings', this),
			{
				xtype: 'zarafa.settingsincomingmailwidget'
			},{
				xtype: 'zarafa.settingssignatureswidget',
				settingsMailCategory: this
			},
			container.populateInsertionPoint('context.settings.category.mail', this)
		];

		Ext.applyIf(config, {
			title: _('Mail'),
			categoryIndex: 1,
			iconCls: 'zarafa-settings-category-mail',
			items: items
		});

		Zarafa.mail.settings.SettingsMailCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingsmailcategory', Zarafa.mail.settings.SettingsMailCategory);
