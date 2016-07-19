Ext.namespace('Zarafa.advancesearch');

/**
 * @class Zarafa.advancesearch.AdvanceSearchContext
 * @extends Zarafa.core.Context
 */
Zarafa.advancesearch.AdvanceSearchContext = Ext.extend(Zarafa.core.Context, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hasToolbar : false,
			hasContentPanel : false,
			current_view : Zarafa.common.data.Views.LIST,
			current_view_mode : Zarafa.common.data.ViewModes.RIGHT_PREVIEW
		});

		Zarafa.advancesearch.AdvanceSearchContext.superclass.constructor.call(this, config);

		this.registerInsertionPoint('main.toolbar.actions.last', this.createMainToolbarSearchViewButton, this);

		Zarafa.core.data.SharedComponentType.addProperty('search.dialog.selectfolder');
	},

	/**
	 * Add search switch view button in main panel tool bar, which used to switch the view of
	 * {@link Zarafa.advancesearch.dialogs.SearchPanel search panel}.
	 * @return {Ext.Button} return search preview button
	 * @private
	 */
	createMainToolbarSearchViewButton : function() 
	{
		var menuItems = new Zarafa.common.CommonViewButtons({'context' : this});

		return {
			xtype : 'button',
			scale : 'large',
			ref : 'searchView',
			hidden : true,
			iconCls : 'view_icon',
			menu : menuItems
		};
	},

	/**
	 * Event handler which is fired when one of the View buttons
	 * has been pressed. This will call {@link #setView setView}
	 * to update the view.
	 * @param {Ext.Button} button The button which was pressed
	 * @private
	 */
	onContextSelectView : function(button)
	{
		this.getModel().setDataMode(button.valueDataMode);
		this.switchView(button.valueView, button.valueViewMode);
	},

	/**
	 * Function was used to get the {@link Zarafa.advancesearch.AdvanceSearchContextModel advance search model}.
	 * @param {Object} config the configuration object which contains the parent context model.
	 * @return {Zarafa.advancesearch.AdvanceSearchContextModel} the advance search context model
	 */
	getModel : function(config)
	{
		if (!Ext.isDefined(this.model)) {
			this.model = new Zarafa.advancesearch.AdvanceSearchContextModel();
		}
		return this.model;
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * This will bid on a dialog.crate or dialog.view for a record with a 
	 * message class set to IPM or IPM.Note.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.search']:
				bid = 1;
				break;
			case Zarafa.core.data.SharedComponentType['search.dialog.selectfolder']:
				bid = 1;
				break;
			case Zarafa.core.data.SharedComponentType['common.create']:
				if(record.get('folder_type') === Zarafa.core.mapi.MAPIFolderType.FOLDER_SEARCH) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Zarafa.core.data.MAPIRecord) {
					if (record.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_FOLDER && record.isSearchFolder()) {
						bid = 1;
					}
				}
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.search']:
				component = Zarafa.advancesearch.dialogs.SearchContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['search.dialog.selectfolder']:
				component = Zarafa.advancesearch.dialogs.SelectFolderContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.create']:
				if(record.get('folder_type') === Zarafa.core.mapi.MAPIFolderType.FOLDER_SEARCH) {
					component = Zarafa.advancesearch.dialogs.CreateSearchFolderContentPanel ;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Zarafa.core.data.MAPIRecord) {
					if (record.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_FOLDER && record.isSearchFolder()) {
						component = Zarafa.advancesearch.ui.SearchFolderContextMenu;
					}
				}
				break;
		}
		return component;
	}

});

Zarafa.onReady(function() {
	container.registerContext(new Zarafa.core.ContextMetaData({
		name : 'advancesearch',
		allowUserVisible : false,
		pluginConstructor : Zarafa.advancesearch.AdvanceSearchContext
	}));
});
