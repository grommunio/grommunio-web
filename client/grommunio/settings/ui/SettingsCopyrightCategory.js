/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsCopyrightCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingscopyrightcategory
 *
 * Special Settings Category which shows the copyright notice
 * of grommunio Web and any possible plugins which register their own
 * copyright notices.
 */
Grommunio.settings.ui.SettingsCopyrightCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.copyright
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.settings.ui.SettingsCopyrightCategory Copyright Category}.
	 * @param {Grommunio.settings.ui.SettingsCopyrightCategory} category The copyright
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		// Get the about texts of iconsets
		var iconsetAbout = container.getServerConfig().getIconsetAbouts();
		var iconsetAboutWidgets = [];
		for ( var iconset in iconsetAbout ) {
			iconsetAboutWidgets.push({
				xtype: 'grommunio.settingscopyrightwidget',
				title: String.format(_('{0} Iconset'), iconsetAbout[iconset]['displayName']),
				about: iconsetAbout[iconset]['about']
			});
		}

		Ext.applyIf(config, {
			title: _("Legal Information"),
			categoryIndex: 10000,
			iconCls: 'grommunio-settings-category-copyright',
			items: [
				{
					xtype: 'grommunio.settingscopyrightwidget',
					about: Grommunio.ABOUT
				},
				container.populateInsertionPoint('context.settings.category.copyright', this)
			].concat(iconsetAboutWidgets)
		});

		Grommunio.settings.ui.SettingsCopyrightCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingscopyrightcategory', Grommunio.settings.ui.SettingsCopyrightCategory);
