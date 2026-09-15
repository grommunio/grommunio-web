/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.core');
Ext.namespace('Grommunio.core.themes');

/**
 * Central theme registration for all available color themes.
 * This file registers all themes at once instead of requiring separate JS files per theme.
 *
 * @class Grommunio.core.Themes
 */
Grommunio.core.Themes = {
	/**
	 * List of all available unified themes (CSS-based, no separate theme files)
	 */
	themes: [
		{ name: 'purple', displayName: _('Purple') },
		{ name: 'orange', displayName: _('Orange') },
		{ name: 'lime', displayName: _('Lime') },
		{ name: 'magenta', displayName: _('Magenta') },
		{ name: 'highcontrast', displayName: _('High Contrast') },
		{ name: 'cyan', displayName: _('Cyan') },
		{ name: 'teal', displayName: _('Teal') },
		{ name: 'indigo', displayName: _('Indigo') },
		{ name: 'red', displayName: _('Red') },
		{ name: 'green', displayName: _('Green') },
		{ name: 'brown', displayName: _('Brown') }
	],

	/**
	 * Register all themes with the container
	 */
	registerAll: function()
	{
		Ext.each(this.themes, function(themeInfo) {
			// Create a proper class name (capitalize first letter of each word)
			var className = 'Theme' + themeInfo.name.charAt(0).toUpperCase() + themeInfo.name.slice(1);

			// Create a dynamic theme class for each theme
			Grommunio.core.themes[className] = Ext.extend(Grommunio.core.ThemePlugin, {});

			// Register the theme plugin
			container.registerPlugin(new Grommunio.core.PluginMetaData({
				name: themeInfo.name,
				displayName: themeInfo.displayName,
				allowUserDisable: false,
				allowUserVisible: false,
				pluginConstructor: Grommunio.core.themes[className]
			}));
		}, this);
	}
};

// Register all themes when ready
Grommunio.onReady(function() {
	Grommunio.core.Themes.registerAll();
});
