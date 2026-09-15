Ext.namespace('Grommunio.plugins.mdm.settings');

/*
 * Settings category entry for MDM
 * @extends 
 */

/**
 * @class Grommunio.plugins.mdm.settings.MDMSettingsCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype Grommunio.plugins.mdmsettingscategory
 *
 * The mdm settings category entry.
 */
Grommunio.plugins.mdm.settings.MDMSettingsCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config) {
		config = config || {};

		Ext.applyIf(config, {
			title : _('Mobile Devices'),
			iconCls : 'icon_mdm_settings',
			items : [{
				xtype : 'Grommunio.plugins.mdm.mdmsettingswidget'
			}]
		});

		Grommunio.plugins.mdm.settings.MDMSettingsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('Grommunio.plugins.mdm.mdmsettingscategory', Grommunio.plugins.mdm.settings.MDMSettingsCategory);
