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
			items : [{
				xtype : 'displayfield',
				fieldLabel : _('WebApp'),
				value : version.getWebApp() + (!Ext.isEmpty(version.getGit()) ? ('-' + version.getGit()) : ''),
				htmlEncode : true
			},{
				xtype : 'displayfield',
				fieldLabel : _('Kopano Core'),
				value : version.getZCP(),
				htmlEncode : true
			},{
				xtype : 'displayfield',
				fieldLabel : _('Server'),
				value : version.getServer(),
				hidden : Ext.isEmpty(version.getServer()),
				htmlEncode : true
			}]
		});

		Zarafa.settings.ui.SettingsVersionWidget.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingsversionwidget', Zarafa.settings.ui.SettingsVersionWidget);
