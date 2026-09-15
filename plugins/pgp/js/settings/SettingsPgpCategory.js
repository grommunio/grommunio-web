Ext.namespace('Grommunio.plugins.pgp.settings');

Grommunio.plugins.pgp.settings.SettingsPgpCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	constructor: function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			id: 'pgp', title: _('OpenPGP'), categoryIndex: 2, iconCls: 'icon_pgp_key',
			items: [{xtype: 'pgp.settingswidget', settingsContext: config.settingsContext}]
		});
		Grommunio.plugins.pgp.settings.SettingsPgpCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('pgp.settingscategory', Grommunio.plugins.pgp.settings.SettingsPgpCategory);
