Ext.namespace('Zarafa.core.themes');

/**
 *
 * @class Zarafa.core.themes.ThemeLime
 * @extends Zarafa.core.ThemePlugin
 */
Zarafa.core.themes.ThemeLime = Ext.extend(Zarafa.core.ThemePlugin, {
	isCorePlugin : true
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'lime',
		displayName : _('Lime'),
		allowUserDisable : false,
		allowUserVisible : false,
		pluginConstructor : Zarafa.core.themes.ThemeLime
	}));
});
