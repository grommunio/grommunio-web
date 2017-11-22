Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailGrid
 * @extends Zarafa.common.ui.grid.MapiMessageGrid
 * @xtype zarafa.mailgrid
 */
Zarafa.mail.ui.MailGrid = Ext.extend(Zarafa.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Zarafa.mail.MailContext} context The context to which this panel belongs
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.mail.MailContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.mail.MailContextModel
	 */
	model : undefined,

	/**
	 * @cfg {Array} sentFolderTypes List of strings of the
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord#getDefaultFolderKey folder key}
	 * for the {@link Zarafa.hierarchy.data.MAPIFolderRecord folders} which contain
	 * messages where the Sender is the Store Owner. For these kinds of
	 * folders a different column set must be loaded.
	 *
	 * By default these will be the 'outbox' and 'sent'
	 * folders.
	 */
	sentFolderTypes : undefined,

	/**
	 * @cfg {Array} unSentFolderTypes List of strings of the
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord#getDefaultFolderKey folder key}
	 * for the {@link Zarafa.hierarchy.data.MAPIFolderRecord folders} which contain
	 * messages where the Sender is the Store Owner. For these kinds of
	 * folders a different column set must be loaded.
	 *
	 * By default these will be the 'drafts' folders.
	 */
	unSentFolderTypes : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.sentFolderTypes)) {
			config.sentFolderTypes = ['outbox', 'sent'];
		}

		if (!Ext.isDefined(config.unSentFolderTypes)){
			config.unSentFolderTypes = ['drafts'];
		}

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			config.store = config.model.getStore();
		}
		config.store = Ext.StoreMgr.lookup(config.store);

		Ext.applyIf(config, {
			xtype: 'zarafa.mailgrid',
			border : false,
			stateful : true,
			statefulRelativeDimensions : false,
			loadMask : this.initLoadMask(),
			viewConfig : this.initViewConfig(),
			sm : this.initSelectionModel(),
			cm : this.initColumnModel(),
			enableDragDrop : true,
			ddGroup : 'dd.mapiitem'
		});

		Zarafa.mail.ui.MailGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.mail.ui.MailGrid.superclass.initEvents.call(this);

		this.on({
			'cellclick': this.onCellClick,
			'rowclick': this.onRowClick,
			'rowbodycontextmenu': this.onRowBodyContextMenu,
			'rowdblclick': this.onRowDblClick,
			scope : this
		});

		this.mon(this.getView(), 'livescrollstart', this.onLiveScrollStart, this);
		this.mon(this.getView(), 'beforesort', this.onBeforeSort, this);

		// Add a buffer to the following 2 event handlers. These are influenced by Extjs when a record
		// is removed from the store. However removing of records isn't performed in batches. This means
		// that wee need to offload the event handlers attached to removing of records in case that
		// a large batch of records is being removed.
		this.mon(this.getSelectionModel(), 'rowselect', this.onRowSelect, this, { buffer : 1 });
		this.mon(this.getSelectionModel(), 'selectionchange', this.onSelectionChange, this, { buffer : 1 });

		this.mon(this.context, 'viewmodechange', this.onContextViewModeChange, this);
		this.mon(this.context, 'viewchange', this.onContextViewChange, this);
		this.onContextViewModeChange(this.context, this.context.getCurrentViewMode());
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
			msg : _('Loading mail') + '...'
		};
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
			// enableRowBody is used for enabling the rendering of
			// the second row in the compact view model. The actual
			// rendering is done in the function getRowClass.
			//
			// NOTE: Even though we default to the extended view,
			// enableRowBody must be enabled here. We disable it
			// later in onContextViewModeChange(). If we set false
			// here, and enable it later then the row body will never
			// be rendered. So disabling after initializing the data
			// with the rowBody works, but the opposite will not.
			enableRowBody : true,
			getRowClass : this.viewConfigGetRowClass,

			// We need a rowselector depth of 15 because of the nested
			// table in the rowBody.
			rowSelectorDepth : 15
		};
	},

	/**
	 * Apply custom style and content for the row body. This will always
	 * apply the Read/Unread style to the entire row. Optionally it will
	 * enable the row body containing the subject.
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
	viewConfigGetRowClass : function(record, rowIndex, rowParams, store)
	{
		var cssClass = (Ext.isFunction(record.isRead) && !record.isRead() ? 'mail_unread' : 'mail_read');

		if (this.enableRowBody) {
			var meta = {}; // Metadata object for Zarafa.common.ui.grid.Renderers.
			var value = ''; // The value which must be rendered
			rowParams.body = '<div class="zarafa-grid-body-container">';

			// Render the categories
			cssClass += ' with-categories';
			var categories = Zarafa.common.categories.Util.getCategories(record);
			var categoriesHtml = Zarafa.common.categories.Util.getCategoriesHtml(categories);
			rowParams.body += '<div class="k-category-add-container"><span class="k-category-add"></span></div><div class="k-category-container">' + categoriesHtml + '</div>';

			// Render the subject
			meta = {};
			value = Zarafa.common.ui.grid.Renderers.subject(record.get('subject'), meta, record);
			rowParams.body += String.format('<div class="grid_compact grid_compact_left grid_compact_subject_cell {0}">{1}</div>', meta.css, value);

			rowParams.body += '</div>';

			return 'x-grid3-row-expanded ' + cssClass;
		}

		return 'x-grid3-row-collapsed ' + cssClass;
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.sm SelectionModel} field
	 *
	 * @return {Ext.grid.RowSelectionModel} The subclass of {@link Ext.grid.AbstractSelectionModel}
	 * @private
	 */
	initSelectionModel : function()
	{
		return new Zarafa.mail.ui.MailRowSelectionModel({
			singleSelect : false
		});
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.cm ColumnModel} field.
	 *
	 * @return {Ext.grid.ColumnModel} The {@link Ext.grid.ColumnModel} for this grid
	 * @private
	 */
	initColumnModel : function()
	{
		return new Zarafa.mail.ui.MailGridColumnModel();
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Zarafa.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Zarafa.mail.data.Views} newView The ID of the selected view.
	 * @param {Zarafa.mail.data.Views} oldView The ID of the previously selected view.
	 */
	onContextViewChange : function(context, newView, oldView)
	{
		if(oldView === Zarafa.mail.data.Views.LIVESCROLL) {
			this.getView().resetScroll();
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
		switch(newViewMode){
			case Zarafa.mail.data.ViewModes.RIGHT_PREVIEW :
			case Zarafa.mail.data.ViewModes.NO_PREVIEW :
			case Zarafa.mail.data.ViewModes.BOTTOM_PREVIEW :
					var compact = newViewMode === Zarafa.mail.data.ViewModes.RIGHT_PREVIEW;
					//The row body must only be enabled in compact view.
					this.getView().enableRowBody = compact;
					this.getColumnModel().setCompactView(compact);
				break;
			case Zarafa.mail.data.ViewModes.SEARCH :
			case Zarafa.mail.data.ViewModes.LIVESCROLL :
				break;
		}
	},

	/**
	 * Event handler for the {@link #beforeconfigchange} event which is fired at the start of
	 * {@link Zarafa.common.ui.grid.ColumnModel#setConfig}. At this time we can
	 * check which columns should be activated based on the {@link #currentEntryId}.
	 *
	 * @param {Ext.gridColumnModel} columnModel The model which is being configured
	 * @param {Object} config The configuration object
	 * @private
	 */
	onBeforeConfigChange : function(columnModel, config)
	{
		if (!this.currentEntryId) {
			return;
		}

		var store = container.getHierarchyStore().getById(this.currentStoreEntryId);
		var folder = store.getFolder(this.currentEntryId);
		var folderKey = folder.getDefaultFolderKey();

		// It will return true if selected folder is 'Outbox' or 'Sent' folder else return false.
		var isSentFolderType = this.sentFolderTypes.indexOf(folderKey) >= 0;
		// It will return true if selected folder is 'Drafts' folder else return false.
		var isUnsentFolderType = this.unSentFolderTypes.indexOf(folderKey) >= 0;
		// it will retur true if selected folder is other then 'Outbox', 'Sent', and 'Drafts' else return false.
		var isReceivedFolderType = (!isSentFolderType && !isUnsentFolderType);

		for (var i = 0, len = config.length; i < len; i++) {
			var column = config[i];

			if (column.dataIndex === 'sent_representing_name') {
				// Here it will visible the 'From' column in mail grid,
				// if selected folder is Received folder type.
				column.hidden = !isReceivedFolderType;
			} else if (column.dataIndex === 'display_to') {
				// Here it will visible the 'To' column in mail grid,
				// if selected folder is sent or unsent folder type.
				column.hidden = !(isSentFolderType || isUnsentFolderType);
			} else if (column.dataIndex === 'message_delivery_time') {
				// Here it will visible the 'Received' column in mail grid,
				// if selected folder is Received folder type.
				column.hidden = !isReceivedFolderType;
			} else if (column.dataIndex === 'client_submit_time') {
				// Here it will visible the 'Sent' column in mail grid,
				// if selected folder is Sent folder type.
				column.hidden = !isSentFolderType;
			} else if(column.dataIndex === 'last_modification_time'){
				// Here it will visible the 'Modified' column in mail grid,
				// if selected folder is unsent folder type.
				column.hidden = !isUnsentFolderType;
			}
		}

		Zarafa.mail.ui.MailGrid.superclass.onBeforeConfigChange.apply(this, arguments);
	},

	/**
	 * Event handler for the cellclick event of the grid. Will mark/unmark a mail
	 * as read when the user clicked on the icon column
	 *
	 * @param {Zarafa.mail.ui.MailGrid} grid The mail grid
	 * @param {Number} rowIndex The index number of the row that was clicked
	 * @param {Number} columnIndex The index number of the column that was clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onCellClick : function(grid, rowIndex, columnIndex, e)
	{
		var record = this.store.getAt(rowIndex);
		if (!Ext.isDefined(record)) {
			return;
		}

		var cm = this.getColumnModel();
		var column = cm.config[columnIndex];
		if (column.dataIndex === 'icon_index' ){
			Zarafa.common.Actions.markAsRead(record, !record.isRead());
		} else if(column.dataIndex === 'flag_due_by') {
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
		var record;

		if ( Ext.get(event.target).hasClass('k-category-add') ){
			// Get the record from the rowIndex
			record = this.store.getAt(rowIndex);

			Zarafa.common.Actions.openCategoriesMenu([record], event.getXY());
		}
	},

	/**
	 * Event handler which is triggered when the user opens the context menu.
	 *
	 * This will call {@link onCellContextMenu} and pass -1 for the column index to prevent it
	 * showing a special context menu if one would be set for specific columns.

	 *
	 * @param {Zarafa.mail.ui.MailGrid} grid The grid which was right clicked
	 * @param {Number} rowIndex The index number of the row which was right clicked
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onRowBodyContextMenu : function(grid, rowIndex, event)
	{
		this.onCellContextMenu(grid, rowIndex, -1, event);
	},

	/**
	 * Event handler which is triggered when the user double-clicks on a particular item in the
	 * grid. This will open a {@link Zarafa.mail.dialogs.ShowMailContentPanel contentpanel} which
	 * contains the selected item.
	 *
	 * @param {Grid} grid The Grid on which the user double-clicked
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
	 * This will updates the {@link Zarafa.mail.MailContextModel MailContextModel} with the record which
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
		} else if (count === 1 && selectionModel.getSelected() === record) {
			this.model.setPreviewRecord(record);
		}
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.mail.ui.MailGrid grid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.mail.MailContextModel contextmodel} about the change.
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
	 * updated batch of mails status.
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
	 * on {@link Zarafa.mail.ui.MailGrid mailgrid}. it will first stop the
	 * {@link Zarafa.core.ContextModel#stopLiveScroll live scroll} and then apply the sorting.
	 * @private
	 */
	onBeforeSort : function()
	{
		this.model.stopLiveScroll();
	}
});

Ext.reg('zarafa.mailgrid', Zarafa.mail.ui.MailGrid);
