Ext.namespace('Zarafa.core.themes');

/**
 * @class Zarafa.core.themes.ThemeDark
 * @extends Zarafa.core.ThemePlugin
 */
Zarafa.core.themes.ThemeHighContrast = Ext.extend(Zarafa.core.ThemePlugin, {});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'highcontrast',
		displayName : _('High Contrast'),
		allowUserDisable : false,
		allowUserVisible : false,
		pluginConstructor : Zarafa.core.themes.ThemeHighContrast
	}));
});
