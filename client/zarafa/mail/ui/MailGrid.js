
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
	context: undefined,

	/**
	 * The {@link Zarafa.mail.MailContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.mail.MailContextModel
	 */
	model: undefined,

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
	sentFolderTypes: undefined,

	/**
	 * @cfg {Array} unSentFolderTypes List of strings of the
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord#getDefaultFolderKey folder key}
	 * for the {@link Zarafa.hierarchy.data.MAPIFolderRecord folders} which contain
	 * messages where the Sender is the Store Owner. For these kinds of
	 * folders a different column set must be loaded.
	 *
	 * By default these will be the 'drafts' folders.
	 */
	unSentFolderTypes: undefined,

	/**
	 * @cfg {Boolean} expandSingleConversation True if {@link Zarafa.mail.settings.SettingsConversationWidget#enableConversations enabled conversation view }
	 * and {@link Zarafa.mail.settings.SettingsConversationWidget#singleExpand single expand conversation} user settings enabled False otherwise
	 *
	 * By default this will be True.
	 */
	expandSingleConversation: true,

	/**
	 * Delay in milliseconds before updating the preview record after a selection change.
	 * This prevents rapid navigation (for example by holding the arrow keys) from
	 * triggering excessive preview loads.
	 * @property
	 * @type Number
	 */
	previewRecordDelay: 50,

	/**
	 * Helper task which delays updating the preview panel for the currently selected record.
	 * @property
	 * @type Ext.util.DelayedTask
	 * @private
	 */
	previewRecordTask: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
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
			ariaLabel: _('Message list'),
			border: false,
			stateful: true,
			statefulRelativeDimensions: false,
			loadMask: this.initLoadMask(),
			supportLiveScroll: true,
			view: new Zarafa.mail.ui.MailGridView(this.initViewConfig()),
			sm: this.initSelectionModel(),
			cm: this.initColumnModel(),
			enableDragDrop: true,
			expandSingleConversation: this.allowExpandOneConversation(),
			ddGroup: 'dd.mapiitem'
		});

		Zarafa.mail.ui.MailGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents: function()
	{
		Zarafa.mail.ui.MailGrid.superclass.initEvents.call(this);

		this.on({
			'cellclick': this.onCellClick,
			//'rowclick': this.onRowClick,
			'rowclick': {
				fn: this.onRowClick,
				buffer: 1,
				scope: this
			},
			'rowbodycontextmenu': this.onRowBodyContextMenu,
			'rowdblclick': this.onRowDblClick,
			scope: this
		});

		this.mon(this.getView(), 'beforelivescrollstart', this.onBeforeLiveScrollStart, this);
		this.mon(this.getView(), 'livescrollstart', this.onLiveScrollStart, this);
		this.mon(this.getView(), 'beforesort', this.onBeforeSort, this);

		this.mon(this.getSelectionModel(), 'beforerowselect', this.onBeforeRowSelect, this);
		// Add a buffer to the following 2 event handlers. These are influenced by Extjs when a record
		// is removed from the store. However removing of records isn't performed in batches. This means
		// that we need to offload the event handlers attached to removing of records in case that
		// a large batch of records is being removed.
		this.mon(this.getSelectionModel(), 'rowselect', this.onRowSelect, this, { buffer: 1 });
		this.mon(this.getSelectionModel(), 'selectionchange', this.onSelectionChange, this, { buffer: 1 });

		this.mon(container, 'afterrendercontentpanel', function(tabPanel){
			this.mon(tabPanel, {
				'tabchange': this.onTabChange,
				'close': this.onTabClose,
				scope: this
			});
		}, this);

		this.mon(this.context, 'viewmodechange', this.onContextViewModeChange, this);
		this.mon(this.context, 'viewchange', this.onContextViewChange, this);
		this.onContextViewModeChange(this.context, this.context.getCurrentViewMode());

		// The conversation structure itself is maintained by the store
		// (see Zarafa.mail.MailStore#regroupConversations).
		this.mon(this.getView(), 'rowupdated', function(view, rowIndex, record) {
			if (record.get('depth') === 0) {
				return;
			}

			// Update the conversation header (to reflect read/unread status and flags)
			var headerStore = record.getStore();
			var i = rowIndex;
			var r;
			do {
				i--;
				r = headerStore.getAt(i);
			} while (r && r.get('depth') > 0);

			if (r) {
				view.refreshRow(r);
			}
		}, this);
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.loadMask} field
	 *
	 * @return {Ext.LoadMask} The configuration object for {@link Ext.LoadMask}
	 * @private
	 */
	initLoadMask: function()
	{
		return {
			msg: _('Loading mail') + '...'
		};
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel#viewConfig} field
	 *
	 * @return {Ext.grid.GridView} The configuration object for {@link Ext.grid.GridView}
	 * @private
	 */
	initViewConfig: function()
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
			enableRowBody: true,
			getRowClass: this.viewConfigGetRowClass,

			// The mail grid is not editable; without this, records that get
			// updated in the store (e.g. after opening a mail merges the full
			// item back into the list record) would show the red dirty-cell
			// marker in their cells.
			markDirty: false,

			// We need a rowselector depth of 15 because of the nested
			// table in the rowBody.
			rowSelectorDepth: 15,
			enableGrouping: this.hasEnabledGrouping(),
			enableGroupingMenu: true
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
		var cssClass = this.grid.getConversationCssClasses(record, rowIndex, store);

		// Highlight the entire row for messages that carry a follow-up flag
		// (Outlook-style), so a flagged/tracked mail stands out in the list.
		if (record.get('flag_status') === Zarafa.core.mapi.FlagStatus.flagged) {
			cssClass += ' k-flagged';
		}

		if (this.enableRowBody) {
			var meta = {}; // Metadata object for Zarafa.common.ui.grid.Renderers.
			var value = ''; // The value which must be rendered
			rowParams.body = '<div class="zarafa-grid-body-container">';

			if (!record.isConversationHeaderRecord()) {
				// Render the categories
				cssClass += ' with-categories';
				var categories = Zarafa.common.categories.Util.getCategories(record);
				var categoriesHtml = Zarafa.common.categories.Util.getCategoriesHtml(categories);
				rowParams.body += '<div class="k-category-add-container"><span class="k-category-add"></span></div><div class="k-category-container">' + categoriesHtml + '</div>';
			}

			// Render the subject (also for conversation items: consistent with
			// normal mails, and it allows the list request to skip the body).
			meta = {};
			value = Zarafa.common.ui.grid.Renderers.subject(record.get('subject'), meta, record);
			rowParams.body += String.format('<div class="grid_compact grid_compact_left grid_compact_subject_cell {0}">{1}</div>', meta.css, value);

			rowParams.body += '</div>';
			cssClass += ' k-compact-row';

			return 'x-grid3-row-expanded ' + cssClass;
		}

		return 'x-grid3-row-collapsed ' + cssClass;
	},

	/**
	 * Helper function to get css classes related to conversation view.
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @param {Number} rowIndex The row index
	 * @param {Ext.data.Store} store The Ext.data.Store this grid is bound to
	 * @return {String} css classes related to conversation item.
	 */
	getConversationCssClasses: function(record, rowIndex, store)
	{
		var isConversationHeader = record.isConversationHeaderRecord();
		var depth = record.get('depth');
		var cssClass = (Ext.isFunction(record.isRead) && !record.isRead() ? 'mail_unread' : 'mail_read');

		// Conversation headers should get the read/unread info from the items in the conversation
		if (isConversationHeader) {
			cssClass = 'mail_read';
			var conversationRecords = store.getConversationItemsFromHeaderRecord(record);
			conversationRecords.every(function(r) {
				if (Ext.isFunction(r.isRead) && !r.isRead()) {
					cssClass = 'mail_unread';
					return false;
				}
				return true;
			});

			cssClass += ' k-conversation-header';

			// The thread line of an expanded conversation starts at the header,
			// right below the expand arrow.
			if (store.isConversationOpened(record)) {
				cssClass += ' k-conversation-open';
			}
		} else if (record.isConversationRecord()) {
			// If its last item of the conversation.
			if (store.getCount() === rowIndex + 1 ||
				store.getAt(rowIndex + 1).get('depth') === 0) {
				cssClass += ' line_circle_end k-last-conversation-item';
			} else {
				cssClass += ' line_circle_l';
			}
		}

		cssClass += ' k-depth-' + depth;

		return cssClass;
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.sm SelectionModel} field
	 *
	 * @return {Ext.grid.RowSelectionModel} The subclass of {@link Ext.grid.AbstractSelectionModel}
	 * @private
	 */
	initSelectionModel: function()
	{
		return new Zarafa.mail.ui.MailRowSelectionModel({
			singleSelect: false
		});
	},

	/**
	 * Initialize the {@link Ext.grid.GridPanel.cm ColumnModel} field.
	 *
	 * @return {Ext.grid.ColumnModel} The {@link Ext.grid.ColumnModel} for this grid
	 * @private
	 */
	initColumnModel: function()
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
	onContextViewChange: function(context, newView, oldView)
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
	onContextViewModeChange: function(context, newViewMode, oldViewMode)
	{
		switch(newViewMode){
			case Zarafa.mail.data.ViewModes.RIGHT_PREVIEW:
			case Zarafa.mail.data.ViewModes.NO_PREVIEW:
			case Zarafa.mail.data.ViewModes.BOTTOM_PREVIEW:
				var compact = newViewMode === Zarafa.mail.data.ViewModes.RIGHT_PREVIEW;
				//The row body must only be enabled in compact view.
				this.getView().enableRowBody = compact;
				this.getColumnModel().setCompactView(compact);
				break;
			case Zarafa.mail.data.ViewModes.SEARCH:
			case Zarafa.mail.data.ViewModes.LIVESCROLL:
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
	onBeforeConfigChange: function(columnModel, config)
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
		// it will return true if selected folder is other then 'Outbox', 'Sent', and 'Drafts' else return false.
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
			} else if (column.dataIndex === 'deferred_send_time') {
				// Here it will visible the 'Scheduled' column in mail grid,
				// if selected folder is Sent folder type.
				column.hidden = !isSentFolderType;
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
	onCellClick: function(grid, rowIndex, columnIndex, e)
	{
		var record = this.store.getAt(rowIndex);
		if (!Ext.isDefined(record)) {
			return;
		}

		// Toggle the conversation when the arrow (icon) column of a header row
		// is clicked. The icon column prevents row selection, so this click is
		// not handled by onBeforeRowSelect and must be handled here.
		if (record.isConversationHeaderRecord()) {
			if (columnIndex === 0) {
				this.toggleConversation(record, grid.selModel, rowIndex);
			}
			return false;
		}

		var cm = this.getColumnModel();
		var column = cm.config[columnIndex];
		if (
			column.dataIndex === 'icon_index' && !(Ext.isFunction(record.isConversationRecord) && record.isConversationRecord()) ||
			column.dataIndex === 'sent_representing_name' && Ext.isFunction(record.isConversationRecord) && record.isConversationRecord() && Ext.fly(e.target).hasClass('k-icon')
		) {
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
		var store = this.store;
		var keepExisting = event.ctrlKey || event.shiftKey;
		// Get the record from the rowIndex
		var record = store.getAt(rowIndex);
		if (!Ext.isDefined(record)) {
			return;
		}

		// Conversation header rows are toggled by onBeforeRowSelect (mousedown
		// anywhere on the row) or onCellClick (arrow column). Handling them
		// here as well would toggle the conversation twice per click.
		if (record.isConversationHeaderRecord()) {
			return;
		}

		if (this.expandSingleConversation && !(keepExisting)) {
			// close all opened conversation when user click on non conversation item.
			var headerRecord = record.isConversationRecord() ? store.getHeaderRecordFromItem(record) : false;
			store.collapseAllConversation(headerRecord);
		}

		if ( Ext.get(event.target).hasClass('k-category-add') ){
			Zarafa.common.Actions.openCategoriesMenu([record], event.getXY());
		}
	},


	/**
	 * Event handler which is triggered when the user opens the context menu.
	 * Overridden to show the standard (multi selection) context menu with all
	 * items of the conversation when a conversation header is right-clicked, so
	 * actions like delete, mark (un)read, categorize and move act on the entire
	 * conversation.
	 *
	 * @param {Zarafa.mail.ui.MailGrid} grid The grid which was right clicked
	 * @param {Number} rowIndex The index number of the row which was right clicked
	 * @param {Number} cellIndex The index number of the column which was right clicked
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onCellContextMenu: function(grid, rowIndex, cellIndex, event)
	{
		var record = this.store.getAt(rowIndex);
		if (record && record.isConversationHeaderRecord()) {
			// Note: header rows cannot be selected, so the conversation items
			// are passed directly instead of going through the selection model.
			var items = this.store.getConversationItemsFromHeaderRecord(record);
			if (!Ext.isEmpty(items)) {
				Zarafa.core.data.UIFactory.openDefaultContextMenu(items, {
					position: event.getXY(),
					context: this.context,
					actsOnTodoListFolder: this.model.getDefaultFolder().isTodoListFolder(),
					// Single-message actions (reply, forward, open, ...) act on
					// the newest message of the conversation, bulk actions
					// (delete, mark read, ...) on all of them.
					conversationHeader: true
				});
			}

			return false;
		}

		return Zarafa.mail.ui.MailGrid.superclass.onCellContextMenu.call(this, grid, rowIndex, cellIndex, event);
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
	onRowBodyContextMenu: function(grid, rowIndex, event)
	{
		var record = this.store.getAt(rowIndex);
		if (record && record.isConversationHeaderRecord()) {
			return this.onCellContextMenu(grid, rowIndex, -1, event);
		}

		this.onCellContextMenu(grid, rowIndex, -1, event);
	},

	/**
	 * Event handler which is triggered when the user double-clicks on a particular item in the grid.
	 * This will check if existing record is opened in browser window then set focus on it otherwise,
	 * Open a {@link Zarafa.mail.dialogs.ShowMailContentPanel contentpanel} which contains the selected item.
	 *
	 * @param {Grid} grid The Grid on which the user double-clicked
	 * @param {Number} rowIndex The Row number on which was double-clicked.
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onRowDblClick: function(grid, rowIndex, e)
	{
		var record = this.getSelectionModel().getSelected();

		var recordClick = grid.getStore().getAt(rowIndex);
		if (!Ext.isDefined(record) || recordClick.isConversationHeaderRecord()) {
			return false;
		}

		// Switch focus to the browser window is record is already opened in browser window.
		var browserWindow = Zarafa.core.BrowserWindowMgr.getOpenedWindow(record);
		if (browserWindow) {
			browserWindow.focus();
		} else {
			Zarafa.common.Actions.openMessageContent(record, undefined, true);
		}
	},

	/**
	 * Event handler before the row selection performs. If selected record is
	 * conversation header then cancel the selection.
	 *
	 * @param {Zarafa.mail.ui.MailRowSelectionModel} selectionModel The selectionModel
	 * @param {Number} rowIndex Then index to be selected.
	 * @param {Boolean} keepExisting False if other selections will be cleared
	 * @param {Zarafa.core.data.IPMRecord} record The record to be selected
	 */
	onBeforeRowSelect: function(selectionModel, rowIndex, keepExisting, record)
	{
		if (record.isConversationHeaderRecord()) {
			if (keepExisting === true) {
				// Range or multi selections may only ever expand a conversation:
				// collapsing would remove rows from the selection range.
				this.openConversation(record, selectionModel, rowIndex, keepExisting);
			} else {
				// A plain click on a header row toggles the conversation.
				this.toggleConversation(record, selectionModel, rowIndex);
			}
			return false;
		}
	},

	/**
	 * Function will toggle the conversation: expand it when it is collapsed and
	 * select its first item, collapse it when it is expanded.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The header record of the conversation.
	 * @param {Zarafa.mail.ui.MailRowSelectionModel} selectionModel The selectionModel
	 * @param {Number} rowIndex The index of the header row.
	 */
	toggleConversation: function(record, selectionModel, rowIndex)
	{
		var store = this.getStore();
		var wasOpened = store.isConversationOpened(record);
		store.toggleConversation(record);

		if (!wasOpened) {
			if (selectionModel) {
				selectionModel.selectRow(rowIndex + 1, false);
			}
			if (this.expandSingleConversation) {
				store.collapseAllConversation(record);
			}
		}
	},

	/**
	 * Function will expand the conversation if closed and select the first item of it.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record needs to expand.
	 * @param {Zarafa.mail.ui.MailRowSelectionModel} selectionModel The selectionModel
	 * @param {Number} rowIndex Then index to be selected.
	 * @param {Boolean} keepExisting False if other selections will be cleared
	 */
	openConversation: function(record, selectionModel, rowIndex, keepExisting)
	{
		var store = this.getStore();
		if (!store.isConversationOpened(record)) {
			store.expandConversation(record);
			if (selectionModel) {
				selectionModel.selectRow(rowIndex+1, keepExisting);
			}
			if (this.expandSingleConversation) {
				store.collapseAllConversation(record);
			}
		}
	},

	/**
	 * Helper function used to check {@link Zarafa.mail.settings.SettingsConversationWidget#enableConversations enabled conversation view }
	 * and {@link Zarafa.mail.settings.SettingsConversationWidget#singleExpand single expand conversation} user setting enabled.
	 *
	 * @return {Boolean} True if {@link Zarafa.mail.settings.SettingsConversationWidget#enableConversations enabled conversation view } and
	 * {@link Zarafa.mail.settings.SettingsConversationWidget#singleExpand expand single conversation} is enabled else false.
	 */
	allowExpandOneConversation: function()
	{
		var settingsModel = container.getSettingsModel();
		return settingsModel.get("zarafa/v1/contexts/mail/enable_conversation_view") && settingsModel.get("zarafa/v1/contexts/mail/expand_single_conversation");
	},

	/**
	 * Event handler which is triggered when the user selects a row from the {@link Ext.grid.GridPanel}.
	 * This will updates the {@link Zarafa.mail.MailContextModel MailContextModel} with the record which
	 * was selected in the grid for preview
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @param {Integer} rowNumber The row number which is selected in the selection model
	 * @param {Ext.data.Record} record The record which is selected for preview.
	 * @private
	 */
	onRowSelect: function(selectionModel, rowNumber, record)
	{
		var count = selectionModel.getCount();

		if (Ext.isFunction(record.isConversationHeaderRecord) && record.isConversationHeaderRecord()) {
			this.cancelPreviewRecordTask();
			this.model.setPreviewRecord(undefined);
		} else if (count === 0) {
			this.cancelPreviewRecordTask();
			this.model.setPreviewRecord(undefined);
		} else if (count === 1 && selectionModel.getSelected() === record) {
			this.queuePreviewRecord(record);
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
	onSelectionChange: function(selectionModel)
	{
		var selections = selectionModel.getSelections();

		this.model.setSelectedRecords(selections);
		if (Ext.isEmpty(selections)) {
		        this.cancelPreviewRecordTask();
		        this.model.setPreviewRecord(undefined);
		}
	},

	/**
	 * Ensure the delayed task for updating the preview record exists.
	 * @return {Ext.util.DelayedTask}
	 * @private
	 */
	getPreviewRecordTask: function()
	{
		if (!this.previewRecordTask) {
		        this.previewRecordTask = new Ext.util.DelayedTask(this.applyPreviewRecord, this);
		}

		return this.previewRecordTask;
	},

	/**
	 * Queue updating the preview panel for the provided record.
	 * @param {Ext.data.Record} record The record to preview.
	 * @private
	 */
	queuePreviewRecord: function(record)
	{
		var task = this.getPreviewRecordTask();
		task.cancel();
		task.delay(this.previewRecordDelay, this.applyPreviewRecord, this, [record]);
	},

	/**
	 * Cancel the delayed preview update task when no longer needed.
	 * @private
	 */
	cancelPreviewRecordTask: function()
	{
		if (this.previewRecordTask) {
		        this.previewRecordTask.cancel();
		}
	},

	/**
	 * Apply the record to the preview panel.
	 * @param {Ext.data.Record} record The record to preview.
	 * @private
	 */
	applyPreviewRecord: function(record)
	{
		this.model.setPreviewRecord(record);
	},

	/**
	 * Cleanup any pending tasks before destroying the grid.
	 * @private
	 */
	beforeDestroy: function()
	{
		this.cancelPreviewRecordTask();
		Zarafa.mail.ui.MailGrid.superclass.beforeDestroy.apply(this, arguments);
	},

	/**
	 * Event handler triggered before the live scroll start. In conversation view the
	 * store contains more rows than inbox items (headers, sent items), so the default
	 * cursor-based check of the view is not usable and we compare the number of real
	 * inbox items with the total count instead.
	 */
	onBeforeLiveScrollStart: function()
	{
		if (this.store.containsConversations() && this.store.getStoreLength() >= this.store.getTotalCount()) {
			return false;
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
	onLiveScrollStart: function(cursor)
	{
		this.model.startLiveScroll(cursor);
	},

	/**
	 * Event handler which triggered when header of grid was clicked to apply the sorting
	 * on {@link Zarafa.mail.ui.MailGrid mailgrid}. it will first stop the
	 * {@link Zarafa.core.ContextModel#stopLiveScroll live scroll} and then apply the sorting.
	 * @private
	 */
	onBeforeSort: function()
	{
		// Sorting works together with the conversation view: the store only
		// groups conversations for the default (newest first) sorting and shows
		// a flat, sorted list for any other sorting. Announce the switch to the
		// flat list, otherwise it looks like the conversation view got lost.
		if (this.getStore().containsConversations()) {
			container.getNotifier().notify(
				'info.conversations',
				_('Conversation view'),
				_('Sorting shows the flat message list. Sort by "Received" (newest first) to show conversations again.')
			);
		}

		this.model.stopLiveScroll();
	},

	/**
	 * Event handler triggers when the configuration of {@link Zarafa.mail.ui.MailGridColumnModel MailGridColumnModel}
	 * is changed.
	 */
	onConfigChange: function ()
	{
		if (this.getView().enableGrouping) {
			var store = this.getStore();
			var sortInfo = this.getStore().sortInfo;
			if (this.getView().isAllowGrouping(sortInfo.field)) {
				store.groupField = sortInfo.field;
			}
		}
	},

	/**
	 * Function which is used to check that grouping has enabled.
	 * @return {Boolean} true if grouping is enabled else return false.
	 */
	hasEnabledGrouping: function ()
	{
		return container.getSettingsModel().get('zarafa/v1/contexts/mail/enable_grouping');
	},

	/**
	 * Called after a row has been removed for the GridView.
	 * This will be called from {@link Zarafa.common.ui.grid.GridPanel#onWriteRecord onWriteRecord}.
	 * Function will check whether the {@link Zarafa.mail.ui.MailRowSelectionModel#updatedLast updatedLast} config is available
	 * and will select row accordingly.
	 *
	 * @param rowIndex {Number} rowIndex the index of row was deleted from grid.
	 * @private
	 */
	onRowRemoved: function(rowIndex)
	{
		var rowSelectionModel= this.getSelectionModel();
		var lastActiveIndex = rowSelectionModel.updatedLast;

		if (Ext.isDefined(lastActiveIndex)) {
			rowIndex = lastActiveIndex;
			rowSelectionModel.clearUpdatedLast();
		}

		Zarafa.mail.ui.MailGrid.superclass.onRowRemoved.call(this, rowIndex);
	},

	/**
	 * Event handler triggers when content tab panel is changed, it's used to
	 * set the focus on selected row.
	 *
	 * @param {Ext.TabPanel} tabPanel the tab panel which contains tabs.
	 * @param {Ext.Panel} activeTab the activeTab from tab panel
	 */
	onTabChange: function(tabPanel, activeTab)
	{
		if (activeTab.id === "zarafa-mainpanel-content") {
			this.getView().setFocus();
		}
	},

	/**
	 * Event handler triggers when tab was close. Which call {@link Zarafa.mail.ui.MailGridView#setFocus setFocus} function
	 * to set the focus on mail grid. 
	 */
	onTabClose: function()
	{
		if (container.getTabPanel().getActiveTab().id === "zarafa-mainpanel-content") {
			this.getView().setFocus();
		}
	}
});

Ext.reg('zarafa.mailgrid', Zarafa.mail.ui.MailGrid);
