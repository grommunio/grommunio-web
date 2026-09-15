/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.ui');

/**
 * @class Grommunio.calendar.ui.CalendarGridView
 * @extends Grommunio.common.ui.grid.MapiMessageGrid
 * @xtype grommunio.calendargrid
 *
 * This view is used to list all the appointments as a list view
 */
Grommunio.calendar.ui.CalendarGridView = Ext.extend(Grommunio.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Grommunio.calendar.CalendarContext} context The context to which this panel belongs
	 */
	context: undefined,

	/**
	 * The {@link Grommunio.calendar.CalendarContextModel} which is obtained from
	 * the {@link #context}.
	 *
	 * @property
	 * @type Grommunio.calendar.CalendarContextModel
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}
		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			config.store = config.model.getStore();
		}
		config.store = Ext.StoreMgr.lookup(config.store);

		config = Ext.applyIf(config, {
			xtype: 'grommunio.calendargrid',
			ariaLabel: _('Appointments list'),
			overCls: 'grommunio-calendar-grid-row-over',
			border: false,
			stateful: true,
			statefulRelativeDimensions: false,
			loadMask: this.initLoadMask(),
			viewConfig: this.initViewConfig(),
			selModel: this.initSelectionModel(),
			colModel: this.initColumnModel(),
			enableDragDrop: true,
			ddGroup: 'dd.mapiitem'
		});

		Grommunio.calendar.ui.CalendarGridView.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Object} view config object
	 * @private
	 */
	initViewConfig: function()
	{
		return {
			forceFit: false,
			getRowClass: this.getRowClass.createDelegate(this)
		};
	},

	/**
	 * @return {Object} loas mask config object
	 * @private
	 */
	initLoadMask: function()
	{
		return {
			msg: _('Loading appointments') + '...'
		};
	},

	/**
	 * creates and returns a column model object, used in {@link Ext.grid.EditorGridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel: function()
	{
		return new Grommunio.calendar.ui.CalendarGridColumnModel();
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel: function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect: false
		});
	},

	/**
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.calendar.ui.CalendarGridView.superclass.initEvents.call(this);

		this.mon(this.model, 'foldermergestatechanged', this.onFolderMergestateChanged, this);
		this.on('rowdblclick', this.onRowDblClick, this);
		this.mon(this.getSelectionModel(), 'selectionchange', this.onSelectionChange, this);
	},

	/**
	 * Event handler which is triggered when the mergeState has
	 * changed for the folders. This will either merge the contents
	 * of all folders into a single Grid, or apply grouping to
	 * clearly differentiate between the different folders
	 * @param {Grommunio.core.ContextModel} model The model which raised the event
	 * @param {Boolean} mergeState The current merge state
	 */
	onFolderMergestateChanged: function(model, mergeState)
	{
		if (mergeState) {
			model.clearGrouping();
		} else {
			model.groupBy('parent_entryid');
		}
	},

	/**
	 * Event handler which is triggered when user double clicks on a row.
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex index of row
	 * @param {Ext.event} eventObj object of the event
	 * @private
	 */
	onRowDblClick: function(grid, rowIndex, eventObj)
	{
		Grommunio.calendar.Actions.openAppointmentContent(grid.getSelectionModel().getSelections());
	},

	/**
	 * Event handler which is triggered when the {@link Grommunio.mail.ui.MailGrid grid}
	 * {@link Grommunio.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Grommunio.mail.MailContextModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange: function(selectionModel)
	{
		this.model.setSelectedRecords(selectionModel.getSelections());
	},


	/**
	 * Modify the row class and CSS style based on the folder to which the
	 * given {@link Grommunio.core.data.IPMRecord record} belongs.
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The record which is loaded in this row
	 * @param {Number} The index number of this record in the given row
	 * @param {Object} rowParams Row parameters (CSS style, body contents/style)
	 * @param {Grommunio.core.data.IPMStore} store The store to which the record belongs
	 * @return {String} a CSS class name to add to the row
	 */
	getRowClass: function(record, index, rowParams, store)
	{
		var cssClass = 'grommunio-calendar-grid-row';

		if (Ext.isFunction(record.isRead)) {
			cssClass += record.isRead() ? ' mail_read' : ' mail_unread';
		}

		return cssClass;
	}
});

Ext.reg('grommunio.calendargrid', Grommunio.calendar.ui.CalendarGridView);
