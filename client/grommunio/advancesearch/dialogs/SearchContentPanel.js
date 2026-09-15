/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch.dialogs');

/**
 * @class Grommunio.advancesearch.dialogs.SearchContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.searchcontentpanel
 *
 * Panel that is used to compose a search result panel.
 */
Grommunio.advancesearch.dialogs.SearchContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function (config)
	{
		config = config || {};

		var advanceSearchTabName = 'advancesearchtab-' + (++Ext.Component.AUTO_ID);

		Ext.applyIf(config, {
			xtype: 'grommunio.searchcontentpanel',
			layout: 'fit',
			name: advanceSearchTabName,
			title: config.searchText,
			iconCls: 'icon_magnifier',
			border: false,
			parentSearchField: config.parentSearchField,
			parentSearchFolderCombo: config.parentSearchFolderCombo,
			items: [{
				xtype: 'grommunio.searchpanel',
				ref: 'searchPanel',
				searchTabId: advanceSearchTabName,
				searchFolder: config.searchFolder,
				searchText: config.searchText,
				virtualTokens: config.virtualTokens,
				searchContentPanel: this
			}]
		});

		Grommunio.advancesearch.dialogs.SearchContentPanel.superclass.constructor.call(this, config);
		this.initEvents();
	},

	/**
	 * Register initial events for the {@link Grommunio.advancesearch.dialogs.SearchContentPanel search content panel}.
	 */
	initEvents: function()
	{
		var contentPanel = container.getTabPanel();
		this.mon(contentPanel, 'tabchange', this.onTabChange, this);
	},

	/**
	 * Event handler triggers when content tab panel is changed, it's used to
	 * toggle search view button & parent context view button when search panel
	 * open/close.
	 *
	 * @param {Ext.TabPanel} tabPanel the tab panel which contains tabs.
	 * @param {Ext.Panel} activeTab the activeTab from tab panel
	 */
	onTabChange: function(tabPanel, activeTab)
	{
		var mainToolbar = container.getMainToolbar();
		var isSearchPanel = activeTab.isXType('grommunio.searchcontentpanel');
		var contextName = container.getCurrentContext().getName();

		// Toggle the search view button.
		mainToolbar.get('grommunio-maintoolbar-view-advancesearch').setVisible(isSearchPanel);

		var currentContextPrintBtn = mainToolbar.get('grommunio-maintoolbar-print-'+ contextName);

		// Disable Print button of other context and enable Print button of advance search,
		// if current active tab is searchPanel.
		// This condition is required for contexts which does not have "Print" button (i.e. Today context).
		if (!Ext.isEmpty(currentContextPrintBtn)) {
			currentContextPrintBtn.setVisible(!isSearchPanel);
		}
		mainToolbar.get('grommunio-maintoolbar-print-advancesearch').setVisible(isSearchPanel);

		switch(contextName) {
			case 'calendar':
				// Toggle calendar context view buttons
				var viewButtons = ['Day','Workweek','Week', 'Month', 'List'];
				Ext.each(viewButtons, function(item, index, array){
					var viewButton = mainToolbar['calendar'+item];
					viewButton.setVisible(!isSearchPanel);
				}, this);
			break;
			default:
				// Toggle other context view button
				var viewButton = mainToolbar.get('grommunio-maintoolbar-view-'+contextName);
				if(Ext.isDefined(viewButton)){
					viewButton.setVisible(!isSearchPanel);
				}
		}

		var searchPanel = activeTab.searchPanel;
		if (Ext.isDefined(searchPanel)) {
			var model = searchPanel.model;
			var searchStore = model.stores[activeTab.name];
			if (Ext.isDefined(searchStore)) {
				var searchGrid = searchPanel.centerRegion.switchBorder.searchGrid;
				var selectionModel = searchGrid.getSelectionModel();
				var records = selectionModel.getSelections();
				model.setSelectedRecords(records, false);
				model.setActiveStore(searchStore);

				var searchFolder = searchStore.searchFolder[activeTab.name];
				if (Ext.isDefined(searchFolder)) {
					searchStore.setSearchEntryId(searchFolder.get('entryid'));
				}
			}
		}
	},

	/**
	 * Function which used to set the parent {@link Grommunio.common.searchfield.ui.SearchTextField SearchTextField}.
	 * @param {Grommunio.common.searchfield.ui.SearchTextField} searchField the parent search field.
	 */
	setParentSearchField: function(searchField)
	{
		this.parentSearchField = searchField;
	},

	/**
	 * Function is used to get the parent {@link Grommunio.common.searchfield.ui.SearchTextField SearchTextField}.
	 * @return {Grommunio.common.searchfield.ui.SearchTextField} parent search field.
	 */
	getParentSearchField: function()
	{
		return this.parentSearchField;
	},

	/**
	 * Function is used to get the parent {@link Grommunio.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}.
	 * @return {Grommunio.common.searchfield.ui.SearchFolderCombo} parent search folder combo.
	 */
	getParentSearchFolderCombo: function()
	{
		return this.parentSearchFolderCombo;
	}
});

Ext.reg('grommunio.searchcontentpanel', Grommunio.advancesearch.dialogs.SearchContentPanel);
