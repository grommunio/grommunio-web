/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.settings');

/**
 * @class Grommunio.calendar.settings.SettingsCalendarCategory
 * @extends Grommunio.settings.ui.SettingsCategory
 * @xtype grommunio.settingscalendarcategory
 *
 * The calendar category for users which will
 * allow the user to configure Calendar related settings
 */
Grommunio.calendar.settings.SettingsCalendarCategory = Ext.extend(Grommunio.settings.ui.SettingsCategory, {
	// Insertion points for this class
	/**
	 * @insert context.settings.category.calendar
	 * Insertion point to register new {@link Grommunio.settings.ui.SettingsWidget widgets}
	 * for the {@link Grommunio.calendar.settings.SettingsCalendarCategory Calendar Category}.
	 * @param {Grommunio.calendar.settings.SettingsCalendarCategory} category The mail
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
			title: _('Calendar'),
			categoryIndex: 4,
			iconCls: 'grommunio-settings-category-calendar',
			items: [{
				xtype: 'grommunio.settingscalendarwidget'
			},{
				xtype: 'grommunio.settingsoverlaywidget'
			},{
				xtype: 'grommunio.settingsreminderwidget'
			},
			container.populateInsertionPoint('context.settings.category.calendar', this)
			]
		});

		Grommunio.calendar.settings.SettingsCalendarCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.settingscalendarcategory', Grommunio.calendar.settings.SettingsCalendarCategory);
