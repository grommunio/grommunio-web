Ext.namespace('Zarafa.plugins.mdm.settings');

/*
 * Settings category entry for MDM
 * @extends 
 */

/**
 * @class Zarafa.plugins.mdm.settings.MDMSettingsCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype Zarafa.plugins.mdmsettingscategory
 *
 * The mdm settings category entry.
 */
Zarafa.plugins.mdm.settings.MDMSettingsCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config) {
		config = config || {};

		Ext.applyIf(config, {
			title : _('Mobile Devices', 'plugin_mdm'),
			iconCls : 'icon_mdm_settings',
			items : [{
				xtype : 'Zarafa.plugins.mdm.mdmsettingswidget'
			}]
		});

		Zarafa.plugins.mdm.settings.MDMSettingsCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('Zarafa.plugins.mdm.mdmsettingscategory', Zarafa.plugins.mdm.settings.MDMSettingsCategory);
