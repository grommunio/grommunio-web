Ext.namespace('Zarafa.core.themes');

/**
 *
 * @class Zarafa.core.themes.ThemePurple
 * @extends Zarafa.core.ThemePlugin
 */
Zarafa.core.themes.ThemePurple = Ext.extend(Zarafa.core.ThemePlugin, {});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'purple',
		displayName : _('Purple'),
		allowUserDisable : false,
		allowUserVisible : false,
		pluginConstructor : Zarafa.core.themes.ThemePurple
	}));
});
