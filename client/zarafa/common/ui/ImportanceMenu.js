Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.ImportanceMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.importancemenu
 *
 * Extend {@link Zarafa.core.ui.menu.ConditionalMenu ConditionalMenu} to add the
 * {@link Zarafa.core.ui.menu.ConditionalItems ConditionalItems} for all possible
 * Importance settings.
 */
Zarafa.common.ui.ImportanceMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: this.createContextImportanceItems()
		});

		Zarafa.common.ui.ImportanceMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the Importance context menu items
	 * @return {Zarafa.core.ui.menu.ConditionalItem[]} The list of Option context menu items
	 * @private
	 */
	createContextImportanceItems : function()
	{
		var buttons = [];

		Ext.each(Zarafa.common.data.ImportanceFlags.flags, function(flag) {
			buttons.push({
				xtype: 'zarafa.importancebutton',
				text: flag.name,
				importanceValue: flag.value,
				iconCls: flag.iconCls
			});
		}, this);

		return buttons;
	}
});

Ext.reg('zarafa.importancemenu', Zarafa.common.ui.ImportanceMenu);
