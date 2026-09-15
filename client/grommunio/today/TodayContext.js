/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.today');

/**
 * @class Grommunio.today.TodayContext
 * @extends Grommunio.core.Context
 *
 * The today context presents an overview of tasks, notes, and appointments for today. The user can customise
 * the today view by adding and removing widgets. Widgets display information such as the aforementioned
 * daily overviews, but can also be made to display other things such as the time in various places in the world,
 * the weather, or a game.
 */
Grommunio.today.TodayContext = Ext.extend(Grommunio.core.Context, {
	// Insertion points for this class
	/**
	 * @insert main.maintoolbar.view.today
	 * Insertion point for populating the main toolbar with a View button. This item is only visible
	 * when this context is active.
	 * @param {Grommunio.mail.TodayContext} context This context
	 */

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function(config)
	{
		if (container.getServerConfig().isWidgetEnabled()){
			// The tab in the top tabbar
			this.registerInsertionPoint('main.maintabbar.left', this.createMainTab, this);
		}
		Grommunio.today.TodayContext.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Grommunio.today.TodayContextModel} The today context model
	 */
	getModel: function()
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Grommunio.today.TodayContextModel();
		}
		return this.model;
	},

	/**
	 * Bid for the given {@link Grommunio.hierarchy.data.MAPIFolderRecord folder}
	 * This will bid on the {@link Grommunio.hierarchy.data.MAPIFolderRecord#isIPMSubTree SubTree} folder.
	 *
	 * @param {Grommunio.hierarchy.data.MAPIFolderRecord} folder The folder for which the context is bidding
	 * @return {Number} 1 when the contexts supports the folder, -1 otherwise
	 */
	bid: function(folder)
	{
		if (folder.isOwnRoot() && container.getServerConfig().isWidgetEnabled()) {
			return 2;
		}

		return 0;
	},

	/**
	 * Obtain the {@link Grommunio.core.ui.widget.WidgetPanel WidgetPanel} object
	 *
	 * @return {Grommunio.core.ui.widget.WidgetPanel} The main panel which should
	 * be used within the {@link Grommunio.core.Context context}
	 */
	createContentPanel: function()
	{
		return {
			xtype: 'grommunio.widgetpanel',
			id: 'grommunio-mainpanel-contentpanel-today',
			settingsPath: 'grommunio/v1/contexts/today',
			showDefaultWidgets: ['mail', 'appointments', 'tasks'],
			context: this,
			collapsible: false,
			numColumns: container.getSettingsModel().get('grommunio/v1/contexts/today/num_columns')
		};
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the
	 * main.maintoolbar.view.today insertion point to allow other plugins to add their items at the end.
	 *
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarViewButtons: function()
	{
		var items = container.populateInsertionPoint('main.maintoolbar.view.today', this) || [];

		return items;
	},

	/**
	 * Adds a button to the top tab bar for this context.
	 * @return {Object} The button for the top tabbar
	 * @private
	 */
	createMainTab: function()
	{
		return {
			text: this.getDisplayName(),
			tabOrderIndex: 1,
			context: this.getName(),
			id: 'mainmenu-button-today'
		};
	}
});

Grommunio.onReady(function() {
	container.registerContext(new Grommunio.core.ContextMetaData({
		name: 'today',
		displayName: _('Today'),
		allowUserVisible: false,
		pluginConstructor: Grommunio.today.TodayContext
	}));
});
