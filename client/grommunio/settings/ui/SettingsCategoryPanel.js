/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.settings.ui');

/**
 * @class Grommunio.settings.ui.SettingsCategoryPanel
 * @extends Ext.Container
 * @xtype grommunio.settingscategorypanel
 *
 * The extra container which displays the {@link Grommunio.settings.ui.SettingsCategoryTab tabs}
 * for the various registered {@link Grommunio.settings.ui.SettingsCategory categories}.
 */
Grommunio.settings.ui.SettingsCategoryPanel = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Grommunio.settings.SettingsContext} context The context which
	 * is using this tab panel
	 */
	context: undefined,

	/**
	 * The currently marked {@link Grommunio.settings.ui.SettingsCategoryTab#setActive active}
	 * {@link Grommunio.settings.ui.SettingsCategoryTab tab}. This is updated during {@link #onViewChange}
	 * @property
	 * @type Grommunio.settings.ui.SettingsCategoryTab
	 */
	activeTab: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			cls:'grommunio-settings-category-panel',
			listeners: {
				afterrender: function() {
					this.getEl().set({ 'role': 'tablist', 'aria-label': _('Settings categories') });
				}
			}
		});

		Grommunio.settings.ui.SettingsCategoryPanel.superclass.constructor.call(this, config);

		if (this.context) {
			this.mon(this.context, 'viewchange', this.onViewChange, this);
		}
	},

	/**
	 * Event handler for the {@link Grommunio.settings.SettingsContext#viewchange} event on
	 * the {@link Grommunio.settings.SettingsContext context}. This will mark the new
	 * {@link Grommunio.settings.ui.SettingsCategoryTab tab} as
	 * {@link Grommunio.settings.ui.SettingsCategoryTab#setActive}.
	 * @param {Grommunio.settings.SettingsContext} context The context which fired the event
	 * @param {Mixed} viewId The view id which should be activated
	 * @param {Mixed} oldViewId the old view which was previously activated
	 * @private
	 */
	onViewChange: function(context, viewId, oldViewId)
	{
		// The viewId is the ID which matches the Grommunio.settings.ui.SettingsCategory
		// as loaded in the Grommunio.settings.ui.SettingsCategoryWidgetPanel. Search
		// through all tabs to find the tab which corresponds with it.
		var item = this.findBy(function(tab) {
			return tab.isTabForId(viewId);
		});

		if (this.activeTab) {
			this.activeTab.setActive(false);
			delete this.activeTab;
		}
		if (!Ext.isEmpty(item)) {
			this.activeTab = item[0];
			this.activeTab.setActive(true);
		}
	}
});

Ext.reg('grommunio.settingscategorypanel', Grommunio.settings.ui.SettingsCategoryPanel);
