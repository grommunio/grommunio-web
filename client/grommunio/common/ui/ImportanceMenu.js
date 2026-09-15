Ext.namespace('Grommunio.common.ui');

/**
 * @class Grommunio.common.ui.ImportanceMenu
 * @extends Grommunio.core.ui.menu.ConditionalMenu
 * @xtype grommunio.importancemenu
 *
 * Extend {@link Grommunio.core.ui.menu.ConditionalMenu ConditionalMenu} to add the
 * {@link Grommunio.core.ui.menu.ConditionalItems ConditionalItems} for all possible
 * Importance settings.
 */
Grommunio.common.ui.ImportanceMenu = Ext.extend(Grommunio.core.ui.menu.ConditionalMenu, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items: this.createContextImportanceItems()
		});

		Grommunio.common.ui.ImportanceMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the Importance context menu items
	 * @return {Grommunio.core.ui.menu.ConditionalItem[]} The list of Option context menu items
	 * @private
	 */
	createContextImportanceItems: function()
	{
		var buttons = [];

		Ext.each(Grommunio.common.data.ImportanceFlags.flags, function(flag) {
			buttons.push({
				xtype: 'grommunio.importancebutton',
				text: flag.name,
				importanceValue: flag.value,
				iconCls: flag.iconCls
			});
		}, this);

		return buttons;
	}
});

Ext.reg('grommunio.importancemenu', Grommunio.common.ui.ImportanceMenu);
