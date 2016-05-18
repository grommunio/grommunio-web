Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.MenuItemTooltipPlugin
 * @extends Object
 * @ptype zarafa.menuitemtooltipplugin
 *
 * This plugin is use to set the tooltip on {@link Ext.menu.Item menuitem}
 * of {@link Ext.splitButton SplitButton}.
 */
Zarafa.core.plugins.MenuItemTooltipPlugin = Ext.extend(Object,{

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};
		Ext.apply(this, config);
	},

	/**
	 * Initializes the {@link Ext.Component Component} to which this plugin has been hooked.
	 * @param {Ext.menu.Item} field The field on which the plugin is installed.
	 */
	init : function(field)
	{
		this.field = field;
		field.menuItemTooltipPlugin = this;
		// Add event listener for the 'activate' event, if we are move the cursor on menu item then the
		// tooltip is display for particular menu item.
		this.field.on('activate', this.applyTooltip, this);
	},

	/**
	 * Used to apply the tooltip on {@link Ext.menu.Item menuitem} of {@link Ext.SplitBtton SplitBtton}
	 * @param {Ext.menu.Item} itemMenu The menu item of {@link Ext.SplitButton splitbutton}
	 */
	applyTooltip : function(itemMenu)
	{
		if(Ext.isDefined(itemMenu.tooltip)){
			Ext.QuickTips.unregister(itemMenu.getEl());
			if(Ext.isObject(itemMenu.tooltip)){
				Ext.QuickTips.register(Ext.apply({
					target: itemMenu.getEl().id
				}, itemMenu.tooltip));
			} else {
				itemMenu.getEl().dom.qtip = itemMenu.tooltip;
			}
		}
	}
});

Ext.preg('zarafa.menuitemtooltipplugin', Zarafa.core.plugins.MenuItemTooltipPlugin);