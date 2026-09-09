Ext.namespace('Zarafa.plugins.pgp.settings');

Zarafa.plugins.pgp.settings.SettingsPgpCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	constructor: function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			id: 'pgp', title: _('OpenPGP'), categoryIndex: 2, iconCls: 'icon_pgp_key',
			items: [{xtype: 'pgp.settingswidget', settingsContext: config.settingsContext}]
		});
		Zarafa.plugins.pgp.settings.SettingsPgpCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('pgp.settingscategory', Zarafa.plugins.pgp.settings.SettingsPgpCategory);
