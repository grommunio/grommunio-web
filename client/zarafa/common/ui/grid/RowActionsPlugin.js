Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.RowActionsPlugin
 * @extends Object
 *
 * Shows a small bar with actions over the grid row under the mouse. The
 * actions come from {@link #getActions} and act on the hovered record
 * without touching the selection.
 */
Zarafa.common.ui.grid.RowActionsPlugin = Ext.extend(Object, {
	/**
	 * @cfg {String} setting The settings path which enables the actions.
	 */
	setting: 'zarafa/v1/contexts/mail/hover_actions',

	/**
	 * @property {Ext.grid.GridPanel} grid
	 */
	grid: undefined,

	/**
	 * @property {Ext.Element} bar The element holding the actions.
	 */
	bar: undefined,

	/**
	 * @property {HTMLElement} row The row the actions are shown for.
	 */
	row: undefined,

	/**
	 * @property {Number} rowIndex The index of {@link #row}.
	 */
	rowIndex: undefined,

	/**
	 * @property {Zarafa.core.data.IPMRecord} record The record of {@link #row}.
	 */
	record: undefined,

	/**
	 * @property {Array} actions The actions as returned by {@link #getActions}.
	 */
	actions: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * @return {Array} The actions, objects with a name, an iconCls, a title,
	 * a handler(record, event) and optionally an update(record, icon, anchor)
	 * which adjusts icon and title to the record, and a supports(record).
	 */
	getActions: function()
	{
		return [];
	},

	/**
	 * @param {Zarafa.core.data.IPMRecord} record The hovered record
	 * @return {Boolean} False when no actions apply to the record
	 */
	supportsRecord: function(record)
	{
		return true;
	},

	/**
	 * Initializes the plugin.
	 * @param {Ext.grid.GridPanel} grid The grid on which the plugin is installed
	 */
	init: function(grid)
	{
		this.grid = grid;
		grid.on('render', this.onGridRender, this, { single: true });
		grid.on('destroy', this.onGridDestroy, this, { single: true });
	},

	/**
	 * Creates the actions in the grid scroller and hooks the grid events.
	 * @param {Ext.grid.GridPanel} grid The rendered grid
	 * @private
	 */
	onGridRender: function(grid)
	{
		var view = grid.getView();
		this.actions = this.getActions();

		this.bar = view.scroller.createChild({
			tag: 'div',
			cls: 'k-row-actions',
			'aria-hidden': 'true',
			cn: this.actions.map(function(action) {
				return {
					tag: 'a',
					cls: 'k-row-action',
					'data-action': action.name,
					title: action.title || '',
					cn: [{ tag: 'span', cls: action.iconCls || '' }]
				};
			})
		});
		this.bar.setVisibilityMode(Ext.Element.VISIBILITY).hide();

		grid.mon(view.mainBody, 'mouseover', this.onMouseOver, this);
		grid.mon(view.scroller, 'mouseleave', this.hide, this);
		grid.mon(this.bar, {
			'mousedown': this.onBarMouseDown,
			'contextmenu': this.onBarContextMenu,
			'click': this.onBarClick,
			'mouseenter': this.onBarEnter,
			'mouseleave': this.onBarLeave,
			scope: this
		});
		grid.mon(view, {
			'refresh': this.hide,
			'rowremoved': this.hide,
			'rowsinserted': this.hide,
			'rowupdated': this.onRowUpdated,
			scope: this
		});
	},

	/**
	 * Moves the actions to the row under the mouse.
	 * @param {Ext.EventObject} e The mouseover event
	 * @private
	 */
	onMouseOver: function(e)
	{
		var view = this.grid.getView();
		var row = e.getTarget('.x-grid3-row', view.rowSelectorDepth);
		if (!row) {
			return;
		}
		if (row === this.row) {
			this.position(row);
			return;
		}

		var rowIndex = view.findRowIndex(row);
		var record = rowIndex !== false ? this.grid.getStore().getAt(rowIndex) : undefined;
		if (!record || !this.isEnabled() || !this.supportsRecord(record)) {
			this.hide();
			return;
		}

		this.row = row;
		this.rowIndex = rowIndex;
		this.record = record;
		this.updateActions(record);
		this.position(row);
		this.bar.show();
	},

	/**
	 * Vertically centers the actions on the first line of the given row.
	 * @param {HTMLElement} row The row element
	 * @private
	 */
	position: function(row)
	{
		var scroller = this.grid.getView().scroller.dom;
		var line = row.getElementsByTagName('tr')[0] || row;
		var top = row.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
		this.bar.setTop(Math.round(top + (line.offsetHeight - this.bar.getHeight()) / 2));
	},

	/**
	 * Lets every action adjust itself to the hovered record and hides the
	 * ones which do not apply.
	 * @param {Zarafa.core.data.IPMRecord} record The hovered record
	 * @private
	 */
	updateActions: function(record)
	{
		Ext.each(this.actions, function(action) {
			var anchor = this.bar.child('a[data-action=' + action.name + ']');
			if (!anchor) {
				return;
			}
			var supported = !Ext.isFunction(action.supports) || action.supports(record);
			anchor.setDisplayed(supported);
			if (supported && Ext.isFunction(action.update)) {
				action.update(record, anchor.child('span'), anchor);
			}
		}, this);
	},

	/**
	 * Re-reads the row element after the view replaced it.
	 * @param {Ext.grid.GridView} view The grid view
	 * @param {Number} rowIndex The index of the updated row
	 * @param {Zarafa.core.data.IPMRecord} record The updated record
	 * @private
	 */
	onRowUpdated: function(view, rowIndex, record)
	{
		if (this.row && rowIndex === this.rowIndex) {
			this.row = view.getRow(rowIndex);
			this.record = record;
			this.updateActions(record);
			this.position(this.row);
		}
	},

	/**
	 * Keeps the grid from treating clicks on the actions as container events.
	 * @param {Ext.EventObject} e The event
	 * @private
	 */
	onBarMouseDown: function(e)
	{
		e.stopEvent();
	},

	/**
	 * Hides the actions and hands the right click to the row underneath,
	 * so the context menu opens as if the actions were not there.
	 * @param {Ext.EventObject} e The contextmenu event
	 * @private
	 */
	onBarContextMenu: function(e)
	{
		e.stopEvent();
		this.hide();

		var browserEvent = e.browserEvent;
		var target = document.elementFromPoint(browserEvent.clientX, browserEvent.clientY);
		if (target) {
			target.dispatchEvent(new MouseEvent('contextmenu', {
				bubbles: true,
				cancelable: true,
				view: window,
				button: 2,
				clientX: browserEvent.clientX,
				clientY: browserEvent.clientY
			}));
		}
	},

	/**
	 * Executes the clicked action on the hovered record.
	 * @param {Ext.EventObject} e The click event
	 * @private
	 */
	onBarClick: function(e)
	{
		e.stopEvent();

		var anchor = e.getTarget('.k-row-action', 3, true);
		var record = this.record;
		if (!anchor || !record) {
			return;
		}

		var name = anchor.getAttribute('data-action');
		var action = this.actions.filter(function(a) {
			return a.name === name;
		})[0];
		if (action) {
			action.handler.call(this, record, e);
		}
	},

	/**
	 * Keeps the hover highlight on the row while the mouse is over the actions.
	 * @private
	 */
	onBarEnter: function()
	{
		if (this.row) {
			Ext.fly(this.row).addClass('x-grid3-row-over');
		}
	},

	/**
	 * @param {Ext.EventObject} e The mouseleave event
	 * @private
	 */
	onBarLeave: function(e)
	{
		if (this.row && !e.within(this.row)) {
			Ext.fly(this.row).removeClass('x-grid3-row-over');
		}
	},

	/**
	 * @return {Boolean} True when the actions are enabled in the settings
	 * @private
	 */
	isEnabled: function()
	{
		return !this.setting || container.getSettingsModel().get(this.setting) !== false;
	},

	/**
	 * Hides the actions and forgets the hovered row.
	 */
	hide: function()
	{
		if (this.row) {
			Ext.fly(this.row).removeClass('x-grid3-row-over');
		}
		this.row = this.rowIndex = this.record = undefined;
		if (this.bar) {
			this.bar.hide();
		}
	},

	/**
	 * @private
	 */
	onGridDestroy: function()
	{
		if (this.bar) {
			this.bar.remove();
			this.bar = undefined;
		}
	}
});
