/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsWelcomeCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingswelcomecategory
 *
 * The category which will be shown the user user who is logging in for the
 * first time, and is presented with the {@link Grommunio.core.ui.WelcomeViewport Welcome page}.
 */
Grommunio.settings.ui.SettingsWelcomeCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.welcome
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.settings.ui.SettingsWelcomeCategory Welcome Category}.
	 * @param {Grommunio.settings.ui.SettingsWelcomeCategory} category The welcome
	 * category to which the widgets will be added.
	 */

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			categoryIndex: 0,
			iconCls: 'grommunio-settings-category-welcome',
			layout: 'column',
			defaults: {
				cls: 'grommunio-settings-widget-welcome'
			},
			items: [{
				xtype: 'grommunio.settingsaccountwidget',
				width: 450,
				style: 'padding-right: 6px;'
			},{
				xtype: 'grommunio.settingscalendarwidget',
				columnWidth: 1,
				style: 'padding-left: 6px;'
			},
			container.populateInsertionPoint('context.settings.category.welcome', this)
			]
		});

		Grommunio.settings.ui.SettingsWelcomeCategory.superclass.constructor.call(this, config);
	},

	/**
	 * Called during rendering of the component.
	 * This will hide the {@link Ext.form.Field Field} which corresponds
	 * to the 'grommunio/v1/contexts/calendar/datepicker_show_busy' setting.
	 * @protected
	 */
	onRender: function()
	{
		Grommunio.settings.ui.SettingsWelcomeCategory.superclass.onRender.apply(this, arguments);

		// We want don't want allow the configuration of the "Show Busy Dates" setting.
		var item = this.find('name', 'grommunio/v1/contexts/calendar/datepicker_show_busy');
		if (!Ext.isEmpty(item)) {
			item[0].hide();
		}
	}
});

Ext.reg('grommunio.settingswelcomecategory', Grommunio.settings.ui.SettingsWelcomeCategory);
