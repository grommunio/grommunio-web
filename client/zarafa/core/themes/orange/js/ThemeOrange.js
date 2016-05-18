Ext.namespace('Zarafa.core.themes');

/**
 *
 * @class Zarafa.core.themes.ThemeOrange
 * @extends Zarafa.core.ThemePlugin
 */
Zarafa.core.themes.ThemeOrange = Ext.extend(Zarafa.core.ThemePlugin, {});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'orange',
		displayName : _('Orange'),
		allowUserDisable : false,
		allowUserVisible : false,
		pluginConstructor : Zarafa.core.themes.ThemeOrange
	}));
});
