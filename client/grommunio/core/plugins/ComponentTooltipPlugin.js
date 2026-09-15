Ext.namespace('Grommunio.core.plugins');

/**
 * @class Grommunio.core.plugins.ComponentTooltipPlugin
 * @extends Object
 * @ptype grommunio.componenttooltipplugin
 *
 * This plugin is use to set the tooltip on {@link Ext.Component Component}.
 */
Grommunio.core.plugins.ComponentTooltipPlugin = Ext.extend(Object,{

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};
		Ext.apply(this, config);
	},

	/**
	 * Initializes the {@link Ext.Component Component} to which this plugin has been hooked.
	 * @param {Ext.menu.Item} field The field on which the plugin is installed.
	 */
	init: function(field)
	{
		this.field = field;
	}
});

Ext.preg('grommunio.componenttooltipplugin', Grommunio.core.plugins.ComponentTooltipPlugin);
