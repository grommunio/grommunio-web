/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch');

/**
 * @class Grommunio.advancesearch.AdvanceSearchContext
 * @extends Grommunio.core.Context
 */
Grommunio.advancesearch.AdvanceSearchContext = Ext.extend(Grommunio.core.Context, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hasToolbar: false,
			hasContentPanel: false,
			current_view: Grommunio.common.data.Views.LIST,
			current_view_mode: Grommunio.common.data.ViewModes.RIGHT_PREVIEW
		});

		Grommunio.advancesearch.AdvanceSearchContext.superclass.constructor.call(this, config);

		Grommunio.core.data.SharedComponentType.addProperty('search.dialog.selectfolder');
		Grommunio.core.data.SharedComponentType.addProperty('search.dialog.searchcategory');
	},

	/**
	 * Returns the buttons for the dropdown list of the Print button in the main toolbar.
	 *
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarPrintButtons: function()
	{
		var defaultItems = [{
			xtype: 'grommunio.conditionalitem',
			id: 'grommunio-maintoolbar-print-singleitem',
			overflowText: _('Print single item'),
			iconCls: 'icon_print',
			tooltip: _('Print selected item') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + P', true),
			plugins: 'grommunio.menuitemtooltipplugin',
			text: _('Print single item'),
			hideOnDisabled: false,
			singleSelectOnly: true,
			handler: this.onPrintSelected,
			scope: this
		}];

		return defaultItems;
	},

	/**
	 * Event handler which is fired when the 'print single' item in the dropdown has been pressed
	 * This calls {@link Grommunio.common.Actions.openPrintDialog} with the previewed {@link Grommunio.core.data.MAPIRecord} record.
	 *
	 * @param {Object} button The button which user pressed.
	 * @param {Ext.EventObject} evt The mouse event
	 * @private
	 */
	onPrintSelected: function (button, evt)
	{
		var records = this.getModel().getSelectedRecords();
		if (Ext.isEmpty(records)) {
			Ext.MessageBox.alert(_('Print'), _('No item selected'));
			return;
		}

		Grommunio.common.Actions.openPrintDialog(records);
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the
	 * main.maintoolbar.view.advancesearch insertion point to allow other plugins to add their items at the end.
	 *
	 * @return {Ext.Component[]} an array of components
	 */
	getMainToolbarViewButtons: function(){
		var items = container.populateInsertionPoint('main.maintoolbar.view.advancesearch') || [];

		var defaultItems = [{
			id: 'grommunio-maintoolbar-view-advancesearch-nopreview',
			overflowText: _('No preview'),
			iconCls: 'icon_previewpanel_off',
			text: _('No preview'),
			valueView: Grommunio.common.data.Views.LIST,
			valueViewMode: Grommunio.common.data.ViewModes.NO_PREVIEW,
			valueDataMode: Grommunio.common.data.DataModes.ALL,
			handler: this.onContextSelectView,
			scope: this
		},{
			id: 'grommunio-maintoolbar-view-advancesearch-previewright',
			overflowText: _('Right preview'),
			iconCls: 'icon_previewpanel_right',
			text: _('Right preview'),
			valueView: Grommunio.common.data.Views.LIST,
			valueViewMode: Grommunio.common.data.ViewModes.RIGHT_PREVIEW,
			valueDataMode: Grommunio.common.data.DataModes.ALL,
			handler: this.onContextSelectView,
			scope: this
		},{
			id: 'grommunio-maintoolbar-view-advancesearch-previewbottom',
			overflowText: _('Bottom preview'),
			iconCls: 'icon_previewpanel_bottom',
			text: _('Bottom preview'),
			valueView: Grommunio.common.data.Views.LIST,
			valueViewMode: Grommunio.common.data.ViewModes.BOTTOM_PREVIEW,
			valueDataMode: Grommunio.common.data.DataModes.ALL,
			handler: this.onContextSelectView,
			scope: this
		}];

		return defaultItems.concat(items);
	},

	/**
	 * Event handler which is fired when one of the View buttons
	 * has been pressed. This will call {@link #setView setView}
	 * to update the view.
	 * @param {Ext.Button} button The button which was pressed
	 * @private
	 */
	onContextSelectView: function(button)
	{
		this.getModel().setDataMode(button.valueDataMode);
		this.switchView(button.valueView, button.valueViewMode);
	},

	/**
	 * Function was used to get the {@link Grommunio.advancesearch.AdvanceSearchContextModel advance search model}.
	 * @param {Object} config the configuration object which contains the parent context model.
	 * @return {Grommunio.advancesearch.AdvanceSearchContextModel} the advance search context model
	 */
	getModel: function(config)
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Grommunio.advancesearch.AdvanceSearchContextModel();
		}
		return this.model;
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * This will bid on a dialog.crate or dialog.view for a record with a
	 * message class set to IPM or IPM.Note.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		switch (type) {
			case Grommunio.core.data.SharedComponentType['common.search']:
				bid = 1;
				break;
			case Grommunio.core.data.SharedComponentType['search.dialog.selectfolder']:
				bid = 1;
				break;
			case Grommunio.core.data.SharedComponentType['common.create']:
				if(record.get('folder_type') === Grommunio.core.mapi.MAPIFolderType.FOLDER_SEARCH) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.core.data.MAPIRecord) {
					if (record.get('object_type') == Grommunio.core.mapi.ObjectType.MAPI_FOLDER && record.isSearchFolder()) {
						bid = 1;
					}
				}
				break;
			case Grommunio.core.data.SharedComponentType['search.dialog.searchcategory']:
				bid = 1;
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['common.search']:
				component = Grommunio.advancesearch.dialogs.SearchContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['search.dialog.selectfolder']:
				component = Grommunio.advancesearch.dialogs.SelectFolderContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.create']:
				if(record.get('folder_type') === Grommunio.core.mapi.MAPIFolderType.FOLDER_SEARCH) {
					component = Grommunio.advancesearch.dialogs.CreateSearchFolderContentPanel;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.core.data.MAPIRecord) {
					if (record.get('object_type') == Grommunio.core.mapi.ObjectType.MAPI_FOLDER && record.isSearchFolder()) {
						component = Grommunio.advancesearch.ui.SearchFolderContextMenu;
					}
				}
				break;
			case Grommunio.core.data.SharedComponentType['search.dialog.searchcategory']:
				component = Grommunio.advancesearch.dialogs.SearchCategoriesContentPanel;
				break;
		}
		return component;
	}

});

Grommunio.onReady(function() {
	container.registerContext(new Grommunio.core.ContextMetaData({
		name: 'advancesearch',
		allowUserVisible: false,
		pluginConstructor: Grommunio.advancesearch.AdvanceSearchContext
	}));
});
