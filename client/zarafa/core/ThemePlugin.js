Ext.namespace('Zarafa.core');

/**
 * This is the class that theme plugins must extend to be found
 * by the themes plugin.
 * 
 * @class Zarafa.core.ThemePlugin
 * @extends Zarafa.core.Plugin
 * 
 */
Zarafa.core.ThemePlugin = Ext.extend(Zarafa.core.Plugin, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Zarafa.core.Plugin.superclass.constructor.call(this, config);

		// Only initialize the plugin when it is selected as running theme
		var theme = container.getServerConfig().getActiveTheme();
		if ( theme === this.getName() ){
			this.initPlugin();
		}
	}
});
