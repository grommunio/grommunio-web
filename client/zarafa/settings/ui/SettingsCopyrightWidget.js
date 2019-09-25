Ext.namespace('Zarafa.settings.ui');

/**
 * @class Zarafa.settings.ui.SettingsCopyrightWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingscopyrightwidget
 *
 * The WebApp copyright notice widget
 */
Zarafa.settings.ui.SettingsCopyrightWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @cfg {String} about The Copyright notice which must be displayed by this widget.
	 * Defaults to {@link Zarafa#ABOUT}
	 */
	about : Zarafa.ABOUT,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Kopano WebApp'),
			layout : 'form',
			items : [{
				xtype : 'displayfield',
				cls : 'zarafa-settings-about-text',
				value : config.about || this.about,
				hideLabel : true,
				htmlEncode : false
			}]
		});

		Zarafa.settings.ui.SettingsCopyrightWidget.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingscopyrightwidget', Zarafa.settings.ui.SettingsCopyrightWidget);
