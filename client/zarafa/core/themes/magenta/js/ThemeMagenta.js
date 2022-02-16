Ext.namespace('Zarafa.core.themes');

/**
 *
 * @class Zarafa.core.themes.ThemeMagenta
 * @extends Zarafa.core.ThemePlugin
 */
Zarafa.core.themes.ThemeMagenta = Ext.extend(Zarafa.core.ThemePlugin, {
	isCorePlugin: true
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name: 'magenta',
		displayName: _('Magenta'),
		allowUserDisable: false,
		allowUserVisible: false,
		pluginConstructor: Zarafa.core.themes.ThemeMagenta
	}));
});
