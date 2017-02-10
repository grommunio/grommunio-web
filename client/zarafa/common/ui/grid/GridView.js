Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.GridView
 * @extends Ext.grid.GridView
 * @xtype zarafa.gridview
 *
 * WebApp specific GridView which contain extra features and bugfixes
 * which could not be resolved by plugins or directly in extjs.
 */
Zarafa.common.ui.grid.GridView = Ext.extend(Ext.grid.GroupingView, {
	/**
	 * @cfg {Boolean} disableScrollToTop {@link Ext.grid.GridView} by default scrolls to top when data is loaded in
	 * {@link Zarafa.core.data.MAPIStore MAPIStore}, but in our case {@link Zarafa.core.ContextModel ContextModel} handles
	 * selection of records based on settings. so this flag will disable default functionality of {@link Ext.grid.GridView}.
	 */
	disableScrollToTop : undefined,

	/**
	 * @cfg {Boolean} isBuffering by default it was false which represent that no more rows are in buffer to 
	 * insert in to {@link Zarafa.mail.ui.MailGrid mailgrid} and if it is true means there are some rows 
	 * in buffer which are going to inser in {@link Zarafa.mail.ui.MailGrid mailgrid}, also it will not allow 
	 * to fire {@link #livescrollstart} event till {@link #isBuffering} get false.
	 */
	isBuffering : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.applyIf(config, {
			enableGrouping : true,
			enableGroupingMenu : false,
			groupTextTpl : '{text:htmlEncode} ({values.rs.length} {[ngettext("Item","Items", values.rs.length)]})',
			disableScrollToTop : false,
			deferEmptyText : true,
			emptyText : '<div class="emptytext">' + _('There are no items to show in this list') + '</div>',
			forceFit : true
		});

		this.addEvents(
			/**
			 * @event beforelivescrollstart
			 * Fires when the scroll is being {@link #onScroll started}.
			 * @param {Zarafa.common.ui.grid.GridView} grid view The grid view which fired the event
			 * @param {HtmlElement} target The target of the event.
			 */
			'beforelivescrollstart',
			/**
			 * @event livescrollstart
			 * Fires when the scroll is being {@link #onScroll started}.
			 * @param {Number} cursor the cursor contains the last index of record in grid.
			 */
			'livescrollstart',
			/**
			 * @event beforesort
			 * Fires when the header of grid is being {@link #onHeaderClick clicked}.
			 * @param {Number} cursor the cursor contains the last index of record in grid.
			 */
			'beforesort'
		);
		Zarafa.common.ui.grid.GridView.superclass.constructor.call(this, config);

		this.initEvents();
	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.ui.grid.GridView.superclass.initEvents.call(this);

		this.on('rowremoved', this.onRowRemoved, this);
	},

	/**
	 * Binds a new Store and ColumnModel to this GridView. Removes any listeners from the old objects (if present)
	 * and adds listeners to the new ones
	 * @param {Ext.data.Store} newStore The new Store instance
	 * @param {Ext.grid.ColumnModel} newColModel The new ColumnModel instance
	 * @private
	 */
	initData : function(newStore, newColModel)
	{
		if (this.ds) {
			this.ds.un('exception', this.onException, this);
		}

		Zarafa.common.ui.grid.GridView.superclass.initData.apply(this, arguments);

		if (this.ds) {
			this.ds.on('exception', this.onException, this);
		}
	},

	/**
	 * Event handler will be called when the {@link Zarafa.core.data.MAPIStore Store} has
	 * fired an exception event.
	 * @param {Ext.data.DataProxy} proxy The proxy which fired the event.
	 * No event handler may modify any properties inside the provided record.
	 * @param {String} type See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {String} action See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Object} options See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Object} response See {@link Ext.data.DataProxy}.{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was subject of the request
	 * that encountered an exception.
	 * @param {String} error (Optional) Passed when a thrown JS Exception or JS Error is
	 * available.
	 * @private
	 */
	onException : function(proxy, type, action, options, response, arg)
	{
		if (options && options.actionType === 'list') {
			this.mainBody.update('<div class="x-grid-empty"><div class="emptytext">' + response.error.info.display_message + '</div></div>');
		}
	},

	/**
	 * Event handler is used to execute {@link #scrollToTop} method to scroll to first item after
	 * {@link Zarafa.core.data.MAPIStore MAPIStore} has completed loading all data, but we don't need this
	 * default behaviour and handle it differently through {@link Zarafa.core.ContextModel ContextModel},
	 * so to disable this functionality we have provided a config {@link #disableScrollToTop}.
	 * @param {Ext.data.Store} store The store which was loaded
	 * @param {Ext.data.Record[]} records The records which were loaded into the store
	 * @param {Object} options The options which were used to load the data
	 */
	onLoad : function(store, record, options)
	{
		// if grid view is destroyed then we shouldn't call this function.
		// if reload/search is called than we don't want to scroll, and if load is called than we should scroll to top.
		if (!Ext.isDefined(options.reload) && this.disableScrollToTop !== true && Ext.isDefined(this.scroller.dom) && options.actionType == 'list') {
			Zarafa.common.ui.grid.GridView.superclass.onLoad.apply(this, arguments);
		}
	},

	/**
	 * Event handler which is called when the data inside the store has changed.
	 * Because {@link #refresh} blocks {@link #applyEmptyText}, we have to call it
	 * here manually again.
	 * @private
	 */
	onDataChange : function()
	{
		Zarafa.common.ui.grid.GridView.superclass.onDataChange.apply(this, arguments);
		this.applyEmptyText();
	},

	/**
	 * Displays the configured emptyText if there are currently no rows to display
	 * @private
	 */
	applyEmptyText : function()
	{
		// When we are reloading, do not apply the empty text, we do not
		// want to confuse the user by indicating no items are found, while we in fact
		// are still downloading the list of items.
		if (!this.grid.store.isExecuting(Zarafa.core.Actions['list'])) {
			Zarafa.common.ui.grid.GridView.superclass.applyEmptyText.call(this);
		}
	},

	/**
	 * This is called internally, once, by this.render after the HTML elements are added to the grid element.
	 * This is always intended to be called after renderUI. Sets up listeners on the UI elements
	 * and sets up options like column menus, moving and resizing.
	 * This function is overridden to use a {@link Zarafa.common.ui.grid.GridDragZone} for the {@link #dragZone},
	 * rather then the default {@link Ext.grid.GridDragZone}.
	 * @private
	 */
	afterRenderUI : function()
	{
		Zarafa.common.ui.grid.GridView.superclass.afterRenderUI.apply(this, arguments);

		if (this.dragZone) {
			this.dragZone.destroy();

			this.dragZone = new Zarafa.common.ui.grid.GridDragZone(this.grid, {
				ddGroup : this.grid.ddGroup || 'GridDD'
			});
		}
	},

	/**
	 * Event handler which is triggered when scroll bar of an {@link Ext.grid.GridPanel Grid}
	 * scrolled. here it will fire {@link #livescrollstart} event, if {@link Ext.grid.GridPanel Grid}
	 * as rows and scroll bar is at the end of {@link Ext.grid.GridPanel Grid}.
	 * @param {Ext.EventObject} event The {@link Ext.EventObject} encapsulating the DOM event.
	 * @param {HtmlElement} target The target of the event.
	 * @param {Object} option The options configuration passed to the {@link #addListener} call.
	 */
	onScroll : function(event, target, option) 
	{
		if(this.fireEvent('beforelivescrollstart', this, target) !== false) {
			// chrome dose not support scrollTopMax so we have to find the scrollTopMax manually.
			var scrollTopMax;
			if(!Ext.isDefined(target.scrollTopMax)) {
				scrollTopMax = target.scrollHeight - target.offsetHeight;
			} else {
				scrollTopMax = target.scrollTopMax;
			}

			var scrollState = scrollTopMax * 0.90;
			if(scrollState < target.scrollTop && !this.isBuffering) {
				var cursor = this.ds.getCount();
				if(cursor !== this.ds.totalLength) {
					this.fireEvent('livescrollstart', cursor);
				}
			}
		}
	},

	/**
	 * Function was used to reset the scroller position to top if it is not. also it will 
	 * set the focus to first line of grid.
	 */
	resetScroll : function()
	{
		if(this.getScrollState().top > 0) {
			this.scrollToTop();
			// it is required in case when user load all records in grid and switch the 
			// view of grid, then it will show the extra space in grid. once user click on grid 
			// it will resize grid and remove the extra space. it happens because focus element of grid
			// will not resize when user switch the view so we have to set the focus on grid.
			this.focusRow(1);
		}
	},

	/**
	 * Called when the GridView has been rendered.
	 * This will check if the store has been loaded already, and apply
	 * the emptyText if needed.
	 * @private
	 */
	afterRender : function()
	{
		Zarafa.common.ui.grid.GridView.superclass.afterRender.apply(this, arguments);

		// When deferEmptyText is false, the emptyText will only be applied after
		// the store has been loaded (the 'load' event has been fired). However, when
		// we arrive here, while the store has already been loaded, we would show nothing,
		// since we missed the event.
		var store = this.grid.store;
		if (this.deferEmptyText === false && store) {
			if (!store.lastOptions || !Ext.isEmpty(Object.keys(store.lastOptions))) {
				this.applyEmptyText();
			}
		}
		this.scroller.on('scroll', this.onScroll, this);
	},

	/**
	 * Called after a row has been removed for the GridView.
	 * This will check if the store has a next/previous row to select in the Grid
	 * @private
	 */
	onRowRemoved : function(view, rowIndex, record)
	{
		var sm = this.grid.getSelectionModel();
		var itemCount = this.grid.store.getCount();

		if (itemCount > 0) {
			// check for the next item in store else select the previous item
			if(rowIndex < itemCount) {
				sm.selectRow(rowIndex);
			} else {
				sm.selectRow(rowIndex - 1);
			}
		} else {
			sm.clearSelections();
			// When the store is empty, sm.clearSelections will not
			// fire any events to indicate that the selections have
			// changed...
			sm.fireEvent('selectionchange', sm);
		}
	},

	/**
	 * Event handler triggered when header of {@link Ext.grid.GridPanel Grid}
	 * was clicked for sort the data of {@link Ext.grid.GridPanel Grid}.
	 * also it will fire the {@link #beforesort} event.
	 * @param {Ext.grid.GridPanel} grid The grid on which the user clicked
	 * @param {Number} The index number of the header which clicked.
	 * @private
	 */
	onHeaderClick : function(grid, index) 
	{
		if(this.fireEvent('beforesort', this) !== false) {
			Zarafa.common.ui.grid.GridView.superclass.onHeaderClick.apply(this, arguments);
		}
	},

	/**
	 * Event handler triggered when header menu item was clicked and the column show/hide submenu (if available).
	 * Performs sorting if the sorter buttons were clicked, otherwise hides/shows the column that was clicked.
	 * also it will fire the {@link #beforesort} event.
	 * @param {Ext.menu.Item} item The item which is being clicked
	 * @private
	 */
	handleHdMenuClick : function(item) 
	{
		if(this.fireEvent('beforesort', this) !== false) {
			Zarafa.common.ui.grid.GridView.superclass.handleHdMenuClick.apply(this, arguments);
		}
	},

	/**
	 * Function used to insert the dummy row in grid and warp the loading mask on it.
	 * also it was {@link #isBuffering} set to true.
	 * 
	 * @param {String} msg the message which load mask shows while loading.
	 */
	showGridRowLoadMask : function(msg)
	{
		this.isBuffering = true;
		var height  = this.getRow(1).offsetHeight;
		var width = this.getTotalWidth();

		// add dummy row at bottom of the grid.
		var style = {styles : 'width :'+width+'px; height :'+height+'px'};
		var tpl = new Ext.Template('<div  id="dummy-row" style = "{styles}"> </div>');
		var html = tpl.apply(style);
		var dom = Ext.DomHelper.insertHtml('beforeEnd',this.mainBody.dom, html);

		// wrap the loading mask on the dummy row.
		Ext.get(dom).mask(msg, 'x-mask-loading x-mask-loading-row');
		var el = Ext.get(dom).child('.ext-el-mask', true);
		el.className += 'x-mask-row';
	},

	/**
	 * Function use to remove the dummy row which use to show the loading mask and
	 * {@link #isBuffering} set to false.
	 */
	removeGridRowLoadMask : function()
	{
		var rowMask = Ext.query('div#dummy-row', this.mainBody.dom)[0];
		if(Ext.isDefined(rowMask)) {
			Ext.get(rowMask).remove();
		}
		this.isBuffering = false;
	}
});

Ext.reg('zarafa.gridview', Zarafa.common.ui.grid.GridView);
