Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.ComponentTooltipPlugin
 * @extends Object
 * @ptype zarafa.componenttooltipplugin
 *
 * This plugin is use to set the tooltip on {@link Ext.Component Component}.
 */
Zarafa.core.plugins.ComponentTooltipPlugin = Ext.extend(Object,{

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
	}
});

Ext.preg('zarafa.componenttooltipplugin', Zarafa.core.plugins.ComponentTooltipPlugin);