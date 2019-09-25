Ext.namespace('Zarafa.core.themes');

/**
 * @class Zarafa.core.themes.ThemeRed
 * @extends Zarafa.core.ThemePlugin
 */
Zarafa.core.themes.ThemeRed = Ext.extend(Zarafa.core.ThemePlugin, {});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'red',
		displayName : _('Red'),
		allowUserDisable : false,
		allowUserVisible : false,
		pluginConstructor : Zarafa.core.themes.ThemeRed
	}));
});
