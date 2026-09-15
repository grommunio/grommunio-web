Ext.namespace('Grommunio.mail.settings');

/**
 * @class Grommunio.mail.settings.SettingsMailCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingsmailcategory
 *
 * The mail category for users which will
 * allow the user to configure Mail related settings
 */
Grommunio.mail.settings.SettingsMailCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.mail
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.mail.settings.SettingsMailCategory Mail Category}.
	 * @param {Grommunio.mail.settings.SettingsMailCategory} category The mail
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
				xtype: 'grommunio.settingsmailwidget'
			},{
				xtype: 'grommunio.settingscomposewidget',
				settingsContext: config.settingsContext
			},{
				xtype: 'grommunio.settingswidget',
				title: _('Cc recipients'),
				cls: 'grommunio-settings-widget k-settings-nogap',
				height: 400,
				layout: {
					type: 'fit'
				},
				items: [{
					xtype: 'grommunio.manageccpanel',
					settingsContext: config.settingsContext
				}],
				getCcPanel: function() {
					return this.findByType('grommunio.manageccpanel')[0];
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
				xtype: 'grommunio.settingsincomingmailwidget'
			},{
				xtype: 'grommunio.settingsnewmailfolderswidget'
			}
		];

		if (container.getServerConfig().isConversationViewEnabled()) {
			items.push({
				xtype: 'grommunio.settingsconversationwidget'
			});
		}

		items.push({
				xtype: 'grommunio.settingssignatureswidget',
				settingsMailCategory: this
			},
			container.populateInsertionPoint('context.settings.category.mail', this)
		);

		Ext.applyIf(config, {
			title: _('Mail'),
			categoryIndex: 1,
			iconCls: 'grommunio-settings-category-mail',
			items: items
		});

		Grommunio.mail.settings.SettingsMailCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingsmailcategory', Grommunio.mail.settings.SettingsMailCategory);
