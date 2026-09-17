/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/core/URLActionMgr.js
 */
Ext.namespace('Grommunio.settings');

/**
 * @class Grommunio.settings.URLAction
 * @extends Object
 *
 * The URL actions for the settings context. Handles the profile action, which
 * opens the settings on the profile picture.
 * @singleton
 */
Grommunio.settings.URLAction = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		Grommunio.core.URLActionMgr.register('profile', {
			handler: this.handleProfile,
			scope: this
		});
	},

	/**
	 * Opens the settings on the general category and asks the account widget to
	 * point out the profile picture.
	 * @param {String} action The url action that is executed
	 * @param {Object} data The data passed for the action
	 * @param {Object} handler The handler config that was passed when registering this action
	 */
	handleProfile: function(action, data, handler)
	{
		var context = container.getContextByName('settings');

		if (!context) {
			return;
		}

		var panel = Ext.ComponentMgr.all.filterBy(function(component) {
			return component instanceof Grommunio.settings.ui.SettingsCategoryWidgetPanel;
		}).first();
		var category = panel ? panel.find('xtype', 'grommunio.settingsgeneralcategory')[0] : undefined;

		context.highlightProfilePhoto = true;

		if (container.getCurrentContext() !== context) {
			if (category && !panel.rendered) {
				context.defaultActiveTab = panel.items.indexOf(category);
			}
			container.switchContext(context);
		} else {
			container.getTabPanel().setActiveTab('grommunio-mainpanel-content');
		}

		if (category && panel.rendered) {
			context.setView(category.getId());
		}

		// The widget consumes the flag while rendering; when it is already
		// there nothing renders and it has to be told directly.
		(function() {
			if (!context.highlightProfilePhoto) {
				return;
			}
			delete context.highlightProfilePhoto;

			var widget = Ext.ComponentMgr.all.filterBy(function(component) {
				return component instanceof Grommunio.settings.ui.SettingsAccountWidget && component.rendered;
			}).first();

			if (widget) {
				widget.highlightPhoto();
			}
		}).defer(500);
	}
});

Grommunio.settings.URLAction = new Grommunio.settings.URLAction();
