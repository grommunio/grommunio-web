Ext.namespace('Zarafa.advancesearch.ui');

/**
 * @class Zarafa.advancesearch.ui.SearchGrid
 * @extends Zarafa.common.ui.grid.MapiMessageGrid
 * @xtype zarafa.searchgrid
 */
Zarafa.advancesearch.ui.SearchGrid = Ext.extend(Zarafa.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Zarafa.advancesearch.AdvanceSearchContext} searchContext The searchContext to which this panel belongs
	 */
	searchContext : undefined,

	/**
	 * The {@link Zarafa.advancesearch.AdvanceSearchContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.advancesearch.AdvanceSearchContextModel
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.searchContext)) {
			config.model = config.searchContext.getModel();
		}

		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			/**
			 * For the first search tab we have already created store instance in model, which is created at the time of the
			 * search context model initialization so we use that store for the first search tab and for the second search tab
			 * we create the new instance of the search store and so on.
			 */
			if(!Ext.isDefined(config.model.store.getSearchStoreUniqueId())){
				var model = config.model;
				model.store.searchStoreUniqueId = config.searchTabId;
				config.store = model.store;
				model.pushStore(config.searchTabId , model.store);
			} else {
				config.store = config.model.createNewSearchStore({searchTabId : config.searchTabId});
			}
		}

		config.store = Ext.StoreMgr.lookup(config.store);

		var searchFolder = config.searchCenterPanel.searchPanel.searchFolder;
		if(Ext.isDefined(searchFolder)) {
			config.store.setSearchStoreEntryId(searchFolder.get('store_entryid'));
			config.store.setSearchEntryId(searchFolder.get('entryid'));
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.searchgrid',
			cls: 'zarafa-searchgrid',
			border : false,
			// Don't make the search grid stateful. By default we always want Kopano Core to sort new search results on relevance.
			stateful : false,
			statefulRelativeDimensions : false,
			loadMask : this.initLoadMask(),
			sm : this.initSelectionModel(),
			cm : new Zarafa.advancesearch.ui.SearchGridColumnModel({
				grid: this,
				folder : config.model.getDefaultFolder()
			}),
			enableDragDrop : true,
			ddGroup : 'dd.mapiitem',
			viewConfig : this.initViewConfig(),
			enableColumnHide: false,
			enableColumnMove: false,
			enableColumnResize: false,
			enableHdMenu: false,
			supportLiveScroll : true,
			autoExpandMin : 200,
			// The maximum number of records that the store can hold and still be sortable
			//TODO: This value should probably be configurable, but let's not do that until we are absolutely sure
			// about doing the sorting this way.
			sortableRecordsMax : 500
		});

		Zarafa.advancesearch.ui.SearchGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.advancesearch.ui.SearchGrid.superclass.initEvents.call(this);

		this.on({
			'headerclick': this.onHeaderClick,
			'cellclick': this.onCellClick,
			'rowclick': this.onRowClick,
			'rowcontextmenu': this.onRowContextMenu,
			'rowdblclick': this.onRowDblClick,
			scope : this
		});

		this.mon(this.getView(), 'livescrollstart', this.onLiveScrollStart, this);
		this.mon(this.getView(), 'beforesort', this.onBeforeSort, this);

		// Add a buffer to the following 2 event handlers. These are influenced by Extjs when a record
		// is removed from the store. However removing of records isn't performed in batches. This means
		// that we need to offload the event handlers attached to removing of records in case that
		// a large batch of records is being removed.
		this.mon(this.getSelectionModel(), 'rowselect', this.onRowSelect, this, { buffer : 1 });
		this.mon(this.getSelectionModel(), 'selectionchange', this.onSelectionChange, this, { buffer : 1 });

		this.mon(this.model, 'searchstop', this.onSearchStop, this);

		this.mon(this.searchContext, 'viewchange', this.onContextViewChange, this);

		this.store.on('beforeupdatesearch', this.onBeforeUpdateSearch, this);

		this.mon(this.searchContext, 'viewmodechange', this.onContextViewModeChange, this);
		this.onContextViewModeChange(this.searchContext, this.searchContext.getCurrentViewMode());
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.loadMask} field
	 *
	 * @return {Ext.LoadMask} The configuration object for {@link Ext.LoadMask}
	 * @private
	 */
	initLoadMask : function()
	{
		return {
			msg : _('Loading Search results') + '...'
		};
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.sm SelectionModel} field
	 *
	 * @return {Ext.grid.RowSelectionModel} The subclass of {@link Ext.grid.AbstractSelectionModel}
	 * @private
	 */
	initSelectionModel : function()
	{
		return new Zarafa.advancesearch.ui.AdvanceSearchRowSelectionModel({
			singleSelect : false
		});
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel#viewConfig} field
	 *
	 * @return {Ext.grid.GridView} The configuration object for {@link Ext.grid.GridView}
	 * @private
	 */
	initViewConfig : function()
	{
		return {
			getRowClass : this.viewConfigGetRowClass,
			enableRowBody : true,
			getBodyCell : this.getBodyCell,
			getSubjectCell : this.getSubjectCell,
			// We need a rowselector depth of 15 because of the nested
			// table in the rowBody.
			rowSelectorDepth : 15
		};
	},

	/**
	 * Apply custom style and content for the row body. This will always
	 * apply the Read/Unread style to the entire row.
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @param {Number} rowIndex The row index
	 * @param {Object} rowParams A config object that is passed to the row template during
	 * rendering that allows customization of various aspects of a grid row.
	 * If enableRowBody is configured true, then the following properties may be set by this function,
	 * and will be used to render a full-width expansion row below each grid row.
	 * @param {Ext.data.Store} store The Ext.data.Store this grid is bound to
	 * @return {String} a CSS class name to add to the row
	 * @private
	 */
	viewConfigGetRowClass: function (record, rowIndex, rowParams, store)
	{
		var cssClass = (Ext.isFunction(record.isRead) && !record.isRead() ? 'mail_unread' : 'mail_read');

		if (this.enableRowBody) {
			rowParams.body = '<div class="zarafa-grid-body-container">';

			// Render the folder location
			var folder = container.getHierarchyStore().getFolder(record.get('parent_entryid'));
			var folderName = folder.getDisplayName();

			var folderLocation= String.format('<div class="k-folder-location-container">' +
				'<div class="k-folder-location" ext:qtip="{0}" ext:qwidth="100%">' +
					'<span class="k-folder-name">{1}</span>' +
				'</div></div>', folderName, Ext.util.Format.ellipsis(folderName, 17));

			cssClass += ' with-categories';
			var categories = Zarafa.common.categories.Util.getCategories(record);
			var categoriesHtml = Zarafa.common.categories.Util.getCategoriesHtml(categories);
			var category = '<div class="k-category"><div class="k-category-add-container"><span class="k-category-add"></span></div><div class="k-category-container">' + categoriesHtml + '</div></div>';

			// Get the subject cell content
			var subject = this.getSubjectCell(record);

			// Get the body cell content
			var body = this.getBodyCell(record);

			// Render subject, category
			if (!Ext.isEmpty(subject)) {
				rowParams.body += folderLocation + subject + category;
			} else {
				rowParams.body += '<div class="k-right-column"><div class="k-folder-location-row">' + folderLocation + '</div>' + category + '</div>';
				cssClass += ' with-no-subject';
			}

			// Render body
			rowParams.body += body + '</div>';
			return 'x-grid3-row-expanded ' + cssClass;
		}

		return 'x-grid3-row-collapsed ' + cssClass;
	},

	/**
	 * Apply custom style and content for the body cell
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @returns {string} an html content string
	 */
	getBodyCell: function (record)
	{
		var meta = {};
		var body = '';
		var messageClass = record.get('message_class');
		switch (messageClass) {
			case 'IPM.Contact':
				body = Ext.util.Format.htmlEncode(record.get('email_address_1'));
				break;
			case 'IPM.Task':
			case 'IPM.TaskRequest':
				body = Zarafa.common.ui.grid.Renderers.percentage(record.get('percent_complete'), meta, record);
				break;
			default:
				body = Ext.util.Format.htmlEncode(record.get('body'));
		}

		return String.format('<div class="grid_compact grid_compact_left grid_compact_body {0}">{1}</div>', meta.css, body);
	},

	/**
	 * Apply custom style and content for the subject cell
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @returns {string} an html content string
	 */
	getSubjectCell: function (record)
	{
		var subject = '';
		var meta = {};
		if (record.isMessageClass('IPM.Contact')) {
			subject = Zarafa.advancesearch.ui.SearchGridRenderers.phoneNumber(record.get('home_telephone_number'), meta, record);
		} else if (!record.isMessageClass('IPM.StickyNote')) {
			subject = Zarafa.common.ui.grid.Renderers.subject(record.get('subject'), meta, record);
		}

		if (!Ext.isEmpty(subject)) {
			subject = String.format('<div class="grid_compact grid_compact_left grid_compact_subject {0}">{1}</div>', meta.css, subject);
		}

		return subject;
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Zarafa.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Zarafa.common.data.Views} newView The ID of the selected view.
	 * @param {Zarafa.common.data.Views} oldView The ID of the previously selected view.
	 */
	onContextViewChange : function(context, newView, oldView)
	{
		if(oldView === Zarafa.common.data.Views.LIVESCROLL) {
			this.getView().resetScroll();
		}
	},

	/**
	 * Event handler for a click on a column header. If a search suggestion is shown
	 * it will trigger a new search with the suggestion.
	 * @param {Zarafa.advancesearch.ui.SearchGrid} grid The search grid
	 * @param {Number} columnIndex The index of the column of which the header was clicked
	 * @param {Event} event The click event
	 */
	onHeaderClick: function(grid, columnIndex, event)
	{
		var suggestion = this.store.suggestion;
		// Don't do anything if there is no suggestion or if the click was not on the suggestion text
		if ( Ext.isEmpty(suggestion) || event.target.className!=='zarafa-search-suggestion' ){
			return;
		}

		var searchToolbarPanel = this.searchCenterPanel.searchPanel.searchToolbar;
		var searchField = searchToolbarPanel.getAdvanceSearchField();
		searchField.setValue(suggestion);
		searchField.onTriggerClick();
	},

	/**
	 * Raw click event handler for the entire grid.
	 * Toggles the unread/read status when a user clicks on the mail icon of a message.
	 * Toggles the flag menu when a user clicks on the flag icon of a message.
	 *
	 * @param {Zarafa.advancesearch.ui.SearchGrid} grid the grid
	 * @param {Number} rowIndex The index of the clicked row
	 * @param {Number} columnIndex The column index of the clicked row
	 * @param {Ext.EventObject} e The click eventobject
	 */
	onCellClick : function(grid, rowIndex, columnIndex, e)
	{
		var record = this.store.getAt(rowIndex);
		if (!Ext.isDefined(record)) {
			return;
		}

		var cm = this.getColumnModel();
		var dataIndex = cm.getDataIndex(columnIndex);
		if (dataIndex === 'icon_index') {
			Zarafa.common.Actions.markAsRead(record, !record.isRead());
		} else if (dataIndex === 'flag_due_by') {
			Zarafa.common.Actions.openFlagsMenu(record, e.getXY());
		}
	},

	/**
	 * Event handler that opens the categories dialog when the user clicks on the
	 * add category icon.
	 *
	 * @param {Zarafa.mail.ui.MailGrid} grid The grid which was right clicked
	 * @param {Number} rowIndex The index number of the row which was right clicked
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onRowClick : function(grid, rowIndex, event)
	{
		if ( Ext.get(event.target).hasClass('k-category-add') ){
			// Get the record from the rowIndex
			var record = this.store.getAt(rowIndex);

			Zarafa.common.Actions.openCategoriesMenu([record], event.getXY());
		}
	},

	/**
	 * Event handler which is triggered when the user opems the context menu.
	 *
	 * There are some selection rules regarding the context menu. If no rows where
	 * selected, the row on which the context menu was requested will be marked
	 * as selected. If there have been rows selected, but the context menu was
	 * requested on a different row, then the old selection is lost, and the new
	 * row will be selected. If the row on which the context menu was selected is
	 * part of the previously selected rows, then the context menu will be applied
	 * to all selected rows.
	 *
	 * @param {Zarafa.advancesearch.ui.SearchGrid} grid The grid which was right clicked
	 * @param {Number} rowIndex The index number of the row which was right clicked
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, event)
	{
		var sm = this.getSelectionModel();

		if (sm.hasSelection()) {
			// Some records were selected...
			if (!sm.isSelected(rowIndex)) {
				// But none of them was the record on which the
				// context menu was invoked. Reset selection.
				sm.clearSelections();
				sm.selectRow(rowIndex);
			}
		} else {
			// No records were selected,
			// select row on which context menu was invoked
			sm.selectRow(rowIndex);
		}

		var records = sm.getSelections();

		Zarafa.core.data.UIFactory.openDefaultContextMenu(records, { position : event.getXY(), context : this.searchContext });
	},

	/**
	 * Event handler which is triggered when the user double-clicks on a particular item in the
	 * grid. This will open a contentpanel which contains the selected item.
	 *
	 * @param {Zarafa.advancesearch.ui.SearchGrid} grid The Grid on which the user double-clicked
	 * @param {Number} rowIndex The Row number on which was double-clicked.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, e)
	{
		Zarafa.common.Actions.openMessageContent(this.getSelectionModel().getSelected());
	},

	/**
	 * Event handler which is trigggerd when the user selects a row from the {@link Ext.grid.GridPanel}.
	 * This will updates the {@link Zarafa.advancesearch.AdvanceSearchContextModel AdvanceSearchContextModel} with the record which
	 * was selected in the grid for preview
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @param {Integer} rowNumber The row number which is selected in the selection model
	 * @param {Ext.data.Record} record The record which is selected for preview.
	 * @private
	 */
	onRowSelect : function(selectionModel, rowNumber, record)
	{
		var count = selectionModel.getCount();

		if (count === 0) {
			this.model.setPreviewRecord(undefined);
		} else if (count == 1 && selectionModel.getSelected() === record) {
			this.model.setPreviewRecord(record);
		}
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.advancesearch.ui.SearchGrid grid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.advancesearch.AdvanceSearchContextModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange : function(selectionModel)
	{
		var selections = selectionModel.getSelections();

		this.model.setSelectedRecords(selections);
		if (Ext.isEmpty(selections)) {
			this.model.setPreviewRecord(undefined);
		}
	},

	/**
	 * Event handler which triggered when scrollbar gets scrolled more then 90% of it`s height.
	 * it will be used to start live scroll on {@link Zarafa.core.data.ListModuleStore ListModuleStore}.
	 * also it will register event on {@link Zarafa.core.data.ListModuleStore ListModuleStore} to get
	 * updated batch of search result status.
	 *
	 * @param {Number} cursor the cursor contains the last index of record in grid.
	 * @private
	 */
	onLiveScrollStart : function(cursor)
	{
		this.model.startLiveScroll(cursor);
	},

	/**
	 * Event handler which triggered when header of grid was clicked to apply the sorting
	 * on {@link Zarafa.advancesearch.ui.SearchGrid search grid}. it will first stop the
	 * {@link Zarafa.core.ContextModel#stopLiveScroll live scroll} and then apply the sorting.
	 * @param {Ext.grid.GridView} gridView The GridView of the grid panel
	 * @private
	 */
	onBeforeSort : function(gridView)
	{
		var cm = this.getColumnModel();
		var dataIndex = cm.getDataIndex(gridView.activeHdIndex);
		// Apply sorting only on search date column, Because other columns doesn't support sorting.
		if (dataIndex === 'searchdate') {

			// Check if the total number of results is less then the maximum for which we will enable sorting
			var store = this.getStore();
			var recordTotalCount = store.getTotalCount();
			if ( recordTotalCount >= this.sortableRecordsMax ){
				Zarafa.common.dialogs.MessageBox.alert(
					_('Sorting tip'),
					_('You can sort by date if you narrow down your search results. Enable filters or adjust your input.'));
				return false;
			}

			// Stop the infinite scrolling if it is running
			this.model.stopLiveScroll();

			// Because we are sorting on the searchdate property and this property is added in the frontend
			// we cannot do remote sorting and will change to local sorting
			store.remoteSort = false;

			var loadedRecordCount = store.getCount();

			// If necessary we must first load all records from the store before we can do the sorting
			if (loadedRecordCount < recordTotalCount){

				// cancel pending load request when sorting is started.
				// NOTE: 'updatelist' is already handled when we stop infinite scroll
				if (store.isExecuting('list')) {
					store.proxy.cancelRequests('list');
				}

				// Set the options for the load request
				var options = {
					actionType : Zarafa.core.Actions['list'],
					folder: this.model.getFolders()[0],
					params: {
						restriction: {
							start: 0,
							limit: recordTotalCount
						}
					},
					callback: function(){
						// Do the sorting again, because Ext tried to do the sorting before we reloaded
						store.sort(store.sortInfo.field, store.sortInfo.direction);
					}
				};
				store.load(options);
			}
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.ContextModel#searchstop searchstop} event.
	 * This will {@link Zarafa.common.ui.LoadMask#hide hide} the {@link Zarafa.common.ui.LoadMask loadmask}, if any.
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onSearchStop : function(model)
	{
		this.loadMask.hide();
	},

	/**
	 * Handler for the beforeupdatesearch event of the search store of the grid
	 * @param {Zarafa.advancesearch.AdvanceSearchStore} store The store that holds the data
	 * of this grid.
	 * @param {Object} searchMeta The returned meta data of the search that was performed
	 */
	onBeforeUpdateSearch: function(store, searchMeta)
	{
		// Don't update for the updatesearch action because the suggestion is not send
		// with the response
		if ( Ext.isDefined(store.lastOptions) && store.lastOptions.originalActionType!==Zarafa.core.Actions.updatesearch ){
			var cm = this.getColumnModel();
			if ( Ext.isEmpty(store.suggestion) ){
				cm.setColumnHeader(0, '');
				cm.setColumnTooltip(0, '');
			} else {
				var encodedSuggestion = Ext.util.Format.htmlEncode(store.suggestion);
				cm.setColumnHeader(0, _('Did you mean') +' <span class="zarafa-search-suggestion">' + encodedSuggestion + '</span> ?');
				cm.setColumnTooltip(0, _('Did you mean') + ' ' + encodedSuggestion);
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.core.Context} fires the
	 * {@link Zarafa.core.Context#viewmodechange viewmodechange} event. This will check
	 * where the preview panel is located, and if needed change the
	 * {@link Ext.grid.Column columns} inside the {@link Ext.grid.ColumnModel ColumnModel}
	 * of the {@link Zarafa.mail.ui.MailGrid MailGrid}. Either use the extended (and more flexible)
	 * set or the more compact set.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event
	 * @param {Zarafa.mail.data.ViewModes} newViewMode The new active mode
	 * @param {Zarafa.mail.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onContextViewModeChange : function(context, newViewMode, oldViewMode)
	{
		var compact = newViewMode === Zarafa.mail.data.ViewModes.RIGHT_PREVIEW;
		this.getView().enableRowBody = compact;
		this.getColumnModel().setCompactView(compact);
	}
});

Ext.reg('zarafa.searchgrid', Zarafa.advancesearch.ui.SearchGrid);
