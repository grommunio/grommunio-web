Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.PagingToolbar
 * @extends Ext.PagingToolbar
 * @xtype zarafa.paging
 *
 * A simple paging tool bar for context.
 */
Zarafa.common.ui.PagingToolbar = Ext.extend(Ext.PagingToolbar, {
	/**
	 * @cfg {Boolean} displayRefresh
	 * <tt>true</tt> to display the refresh button item (defaults to <tt>false</tt>)
	 */
	displayRefresh: false,

	/**
	 * @cfg {Boolean} displayInfo
	 * <tt>true</tt> to display the paging information (defaults to <tt>false</tt>)
	 */
	displayInfo : false,

	/**
	 * Initialises the paging component.
	 * This will build the paging component listen to some exents
	 * @private
	 */
	initComponent : function()
	{
		this.cls = 'zarafa-paging-toolbar';
		
		var pagingItems = [this.first = new  Ext.Toolbar.Button({
			tooltip: this.firstText,
			overflowText: this.firstText,
			iconCls: 'x-tbar-page-first',
			disabled: true,
			handler: this.moveFirst,
			scope: this
		}), this.prev = new Ext.Toolbar.Button({
			tooltip: this.prevText,
			overflowText: this.prevText,
			iconCls: 'x-tbar-page-prev',
			disabled: true,
			handler: this.movePrevious,
			scope: this
		}), 
		this.beforePageText,
		this.inputItem = new Ext.form.NumberField({
			cls: 'x-tbar-page-number',
			allowDecimals: false,
			allowNegative: false,
			enableKeyEvents: true,
			selectOnFocus: true,
			submitValue: false,
			listeners: {
				scope: this,
				keydown: this.onPagingKeyDown,
				blur: this.onPagingBlur
			}
		}), this.afterTextItem = new Ext.Toolbar.TextItem({
			text: String.format(this.afterPageText, 1)
		}),
		this.next = new Ext.Toolbar.Button({
			tooltip: this.nextText,
			overflowText: this.nextText,
			cls: 'x-btn-page-next',
			iconCls: 'x-tbar-page-next',
			disabled: true,
			handler: this.moveNext,
			scope: this
		}), this.last = new Ext.Toolbar.Button({
			tooltip: this.lastText,
			overflowText: this.lastText,
			iconCls: 'x-tbar-page-last',
			disabled: true,
			handler: this.moveLast,
			scope: this
		})];


		var userItems = this.items || this.buttons || [];
		if (this.prependButtons) {
			this.items = userItems.concat(pagingItems);
		}else{
			this.items = pagingItems.concat(userItems);
		}
		delete this.buttons;

		// display refresh item if displayRefresh is set
		if(this.displayRefresh){
			this.items.push('-');
			this.items.push(this.refresh = new Ext.Toolbar.Button({
					tooltip: this.refreshText,
					overflowText: this.refreshText,
					iconCls: 'x-tbar-loading',
					handler: this.doRefresh,
					scope: this
				})
			);
		}

		// display info if displayInfo is set
		if(this.displayInfo){
			this.items.push('->');
			this.items.push(this.displayItem = new Ext.Toolbar.TextItem({}));
		}

		Ext.PagingToolbar.superclass.initComponent.call(this);

		this.addEvents(
			/**
			 * @event change
			 * Fires after the active page has been changed.
			 * @param {Ext.PagingToolbar} this
			 * @param {Object} pageData An object that has these properties:<ul>
			 * <li><code>total</code> : Number <div class="sub-desc">The total number of records in the dataset as
			 * returned by the server</div></li>
			 * <li><code>activePage</code> : Number <div class="sub-desc">The current page number</div></li>
			 * <li><code>pages</code> : Number <div class="sub-desc">The total number of pages (calculated from
			 * the total number of records in the dataset as returned by the server and the current {@link #pageSize})</div></li>
			 * </ul>
			 */
			'change',
			/**
			 * @event beforechange
			 * Fires just before the active page is changed.
			 * Return false to prevent the active page from being changed.
			 * @param {Ext.PagingToolbar} this
			 * @param {Object} params An object hash of the parameters which the PagingToolbar will send when
			 * loading the required page. This will contain:<ul>
			 * <li><code>start</code> : Number <div class="sub-desc">The starting row number for the next page of records to
			 * be retrieved from the server</div></li>
			 * <li><code>limit</code> : Number <div class="sub-desc">The number of records to be retrieved from the server</div></li>
			 * </ul>
			 * <p>(note: the names of the <b>start</b> and <b>limit</b> properties are determined
			 * by the store's {@link Ext.data.Store#paramNames paramNames} property.)</p>
			 * <p>Parameters may be added as required in the event handler.</p>
			 */
			'beforechange'
		);

		this.on('afterlayout', this.onFirstLayout, this, {single: true});

		if (!Ext.isDefined(this.cursor)) {
			this.cursor =  0;
		}

		this.bindStore(this.store, true);
	},

	/**
	 * Binds the paging toolbar to the specified {@link Ext.data.Store}
	 * @param {Store} store The store to bind to this toolbar
	 * @param {Boolean} initial (Optional) true to not remove listeners
	 */
	bindStore : function(store, initial){
		Zarafa.common.ui.PagingToolbar.superclass.bindStore.apply(this, arguments);

		if(this.store) {
			this.mon(this.store, 'search', function(){
				// Reset the page size so the pagination toolbar (if shown) will work correctly.
				// It might have changed when the user sorted the search results.
				this.pageSize = container.getSettingsModel().get('zarafa/v1/main/page_size');
			}, this);
			
			this.mon(this.store, 'beforeupdatesearch', this.updateInfo, this);
		} else {
			this.mun(this.store, 'beforeupdatesearch', this.updateInfo, this);
		}
	},

	/**
	 * This will update the paging status message to be displayed and also the
	 * will preserve the state of refresh buttton to be enabled/disable on every
	 * {@link Zarafa.core.data.IPMStore#load onLoad}
	 * @private
	 */
	updateInfo : function()
	{
		if(this.displayItem){
			var count = this.store.getCount();
			var msg = count === 0 ?
				this.emptyMsg :
				String.format(
					this.displayMsg,
					this.cursor+1, this.cursor+count, this.store.getTotalCount()
				);
			this.displayItem.setText(msg);
		}
	},

	/**
	 * Event handler which is fired after the {@link Zarafa.core.data.IPMStore store} has
	 * loaded data from the server. This will enable the "Refresh" button again, causing a "loading"
	 * icon to disappear.
	 * @param {Zarafa.core.data.IPMStore} store.
	 * @param {Ext.data.Record[]} records list of records to operate on. In case of 'read' this will be ignored.
	 * @param {Object} parameters object containing user parameters such as range (pagination) information, sorting information, etc.
	 * @private
	 */
	onLoad : function(store, r, o)
	{
		if(!this.rendered){
			this.dsLoaded = [store, r, o];
			return;
		}
		var p = this.getParams();
		if (o.params && o.params.restriction && !Ext.isEmpty(o.params.restriction[p.restriction.start])) {
			this.cursor =  o.params.restriction[p.restriction.start];
		}

		var d = this.getPageData(), ap = d.activePage, ps = d.pages;

		this.afterTextItem.setText(String.format(this.afterPageText, d.pages));
		this.inputItem.setValue(ap);
		this.first.setDisabled(ap == 1);
		this.prev.setDisabled(ap == 1);
		this.next.setDisabled(ap == ps);
		this.last.setDisabled(ap == ps);

		if(this.refresh){
			this.refresh.enable();
		}
		this.updateInfo();
		this.fireEvent('change', this, d);
	},

	/**
	 * Error handler which is fired when the 'load' action on the store failed.
	 * @private
	 */
	onLoadError : function()
	{
		if (!this.rendered) {
			return;
		}
		if (this.refresh) {
			this.refresh.enable();
		}
	},

	/**
	 * This will get parameters  such as range (pagination) information, etc from the
	 * {@link Zarafa.core.data.IPMStore store} which is used for mapping Object for load calls.
	 * @private
	 */
	getParams : function()
	{
		// retain backwards compat, allow params on the toolbar itself, if they exist.
		var parameters =  this.paramNames || this.store.paramNames;

		// Extjs puts the pagination into the parameters, move it into the restriction
		if (Ext.isDefined(parameters.start)) {
			parameters.restriction = parameters.restriction || {};
			parameters.restriction.start = parameters.start;
			delete parameters.start;
		}

		if (Ext.isDefined(parameters.limit)) {
			parameters.restriction = parameters.restriction || {};
			parameters.restriction.limit = parameters.limit;
			delete parameters.limit;
		}

		return parameters;
	},

	/**
	 * This will move the page to next or preivous page and fire the load event on
	 * {@link Zarafa.core.data.IPMStore store} to get the data
	 * @param {Ext.Number} start start range from where the items should be displayed
	 * @private
	 */
	doLoad : function(start)
	{
		var o = {
			restriction: {}
		};

		var pn = this.getParams();

		o.restriction[pn.restriction.start] = start;
		o.restriction[pn.restriction.limit] = this.pageSize;
		if(this.fireEvent('beforechange', this, o) !== false){
			this.store.load({
				folder : this.store.lastOptions.folder,
				params: o
			});
		}
	}
});

Ext.reg('zarafa.paging', Zarafa.common.ui.PagingToolbar);
