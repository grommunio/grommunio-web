// Create the namespace that will be used for this plugin
Ext.namespace('Zarafa.plugins.themeexample');

/**
 * A theme plugin should extend {@link Zarafa.core.ThemePlugin}. If it only changes the css
 * there is nothing to implement in this class.
 * @class Zarafa.plugins.themeexample.Theme
 * @extends Zarafa.core.ThemePlugin
 */
Zarafa.plugins.themeexample.Theme = Ext.extend(Zarafa.core.ThemePlugin, {});

// Register the plugin with the container after the WebApp has loaded.
Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({

		// To avoid problems the name of a plugin should be exactly the same as the
		// the name of the directory it is located in.
		name : 'themeexample',

		// The displayName is what will be shown in the dropdown in which the user can pick a theme
		displayName : _('Example Theme'),

		// Do not allow the user to disable this plugin
		allowUserDisable : false,

		// Do not show this plugin in the plugin list
		allowUserVisible : false,

		pluginConstructor : Zarafa.plugins.themeexample.Theme,

		// The 'about' text will be shown in the About part of the settings
		about : '<a target="_blank" href="http://www.freepik.com/free-photos-vectors/background">Background vector designed by Freepik</a>'
	}));
});
