Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsVersionWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingsversionwidget
 *
 * The WebApp version widget
 */
Zarafa.settings.ui.SettingsVersionWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var version = container.getVersion();

		Ext.applyIf(config, {
			title : _('Version information'),
			layout : 'form',
			defaults : {
				xtype : 'displayfield',
				htmlEncode : true
			},
			items : [{
				fieldLabel : _('WebApp'),
				value : version.getWebApp() + (!Ext.isEmpty(version.getGit()) ? ('-' + version.getGit()) : '')
			},{
				fieldLabel : _('Kopano Core'),
				value : version.getZCP()
			},{
				fieldLabel : _('Server'),
				value : version.getServer(),
				hidden : Ext.isEmpty(version.getServer())
			},
				container.populateInsertionPoint('settings.versioninformation')
			]
		});

		Zarafa.settings.ui.SettingsVersionWidget.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingsversionwidget', Zarafa.settings.ui.SettingsVersionWidget);
