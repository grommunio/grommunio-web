Ext.namespace('Grommunio.core');

/**
 * This is the class that theme plugins must extend to be found
 * by the themes plugin.
 *
 * @class Grommunio.core.ThemePlugin
 * @extends Grommunio.core.Plugin
 *
 */
Grommunio.core.ThemePlugin = Ext.extend(Grommunio.core.Plugin, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Grommunio.core.Plugin.superclass.constructor.call(this, config);

		// Only initialize the plugin when it is selected as running theme
		var theme = container.getServerConfig().getActiveTheme();
		if ( theme === this.getName() ){
			this.initPlugin();
		}
	}
});
