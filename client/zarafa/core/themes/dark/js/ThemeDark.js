Ext.namespace('Zarafa.core.themes');

/**
 * @class Zarafa.core.themes.ThemeDark
 * @extends Zarafa.core.ThemePlugin
 */
Zarafa.core.themes.ThemeDark = Ext.extend(Zarafa.core.ThemePlugin, {});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'dark',
		displayName : _('Dark'),
		allowUserDisable : false,
		allowUserVisible : false,
		pluginConstructor : Zarafa.core.themes.ThemeDark
	}));
});
