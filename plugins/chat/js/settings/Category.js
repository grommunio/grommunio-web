Ext.namespace('Zarafa.plugins.chat.settings');

/**
 * @class Zarafa.plugins.chat.settings.Category
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.plugins.chat.settings.category
 */
Zarafa.plugins.chat.settings.Category = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : 'Chat',
			categoryIndex : 12,
			iconCls : 'k-chat-settings-category',
			items : [{
				xtype : 'zarafa.plugins.chat.settings.generalsettingswidget'
			}]
		});

		Zarafa.plugins.chat.settings.Category.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.plugins.chat.settings.category', Zarafa.plugins.chat.settings.Category);
