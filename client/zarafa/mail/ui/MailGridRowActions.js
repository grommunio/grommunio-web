Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailGridRowActions
 * @extends Object
 * @ptype zarafa.mailgridrowactions
 *
 * Shows the read state, follow up and delete actions over the mail
 * grid row under the mouse.
 */
Zarafa.mail.ui.MailGridRowActions = Ext.extend(Object, {
	/**
	 * @cfg {String} setting The settings path which enables the actions.
	 */
	setting: 'zarafa/v1/contexts/mail/hover_actions',

	/**
	 * @property {Zarafa.mail.ui.MailGrid} grid
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
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		Ext.apply(this, config);
	},

	/**
	 * Initializes the plugin.
	 * @param {Zarafa.mail.ui.MailGrid} grid The grid on which the plugin is installed
	 */
	init: function(grid)
	{
		this.grid = grid;
		grid.on('render', this.onGridRender, this, { single: true });
		grid.on('destroy', this.onGridDestroy, this, { single: true });
	},

	/**
	 * Creates the actions in the grid scroller and hooks the grid events.
	 * @param {Zarafa.mail.ui.MailGrid} grid The rendered grid
	 * @private
	 */
	onGridRender: function(grid)
	{
		var view = grid.getView();

		this.bar = view.scroller.createChild({
			tag: 'div',
			cls: 'k-row-actions',
			'aria-hidden': 'true',
			cn: [{
				tag: 'a',
				cls: 'k-row-action',
				'data-action': 'read',
				cn: [{ tag: 'span', cls: 'k-row-action-read' }]
			},{
				tag: 'a',
				cls: 'k-row-action',
				'data-action': 'flag',
				title: _('Follow up'),
				cn: [{ tag: 'span', cls: 'icon_flag_red' }]
			},{
				tag: 'a',
				cls: 'k-row-action',
				'data-action': 'delete',
				title: _('Delete'),
				cn: [{ tag: 'span', cls: 'icon_delete' }]
			}]
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
		if (!record || !this.isEnabled() || (Ext.isFunction(record.isConversationHeaderRecord) && record.isConversationHeaderRecord())) {
			this.hide();
			return;
		}

		this.row = row;
		this.rowIndex = rowIndex;
		this.record = record;
		this.updateReadAction(record);
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
	 * Updates the icon and tooltip of the read action for the given record.
	 * @param {Zarafa.core.data.IPMRecord} record The hovered record
	 * @private
	 */
	updateReadAction: function(record)
	{
		var read = !Ext.isFunction(record.isRead) || record.isRead();
		var icon = this.bar.child('.k-row-action-read');
		icon.removeClass(['icon_mail_read', 'icon_mail_unread']).addClass(read ? 'icon_mail_unread' : 'icon_mail_read');
		icon.parent().dom.title = read ? _('Mark Unread') : _('Mark Read');
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
			this.updateReadAction(record);
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

		var action = e.getTarget('.k-row-action', 3, true);
		var record = this.record;
		if (!action || !record) {
			return;
		}

		switch (action.getAttribute('data-action')) {
			case 'read':
				Zarafa.common.Actions.markAsRead(record, !record.isRead());
				break;
			case 'flag':
				Zarafa.common.Actions.openFlagsMenu(record, e.getXY());
				break;
			case 'delete':
				this.hide();
				Zarafa.common.Actions.deleteRecords(record);
				break;
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
		return container.getSettingsModel().get(this.setting) !== false;
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

Ext.preg('zarafa.mailgridrowactions', Zarafa.mail.ui.MailGridRowActions);
