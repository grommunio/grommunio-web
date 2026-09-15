/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/*
 * #dependsFile client/grommunio/note/ui/NoteGridColumnModel.js
 */
Ext.namespace('Grommunio.note.ui');

/**
 * @class Grommunio.note.ui.NoteGrid
 * @extends Grommunio.common.ui.grid.MapiMessageGrid
 * @xtype grommunio.notegrid
 *
 * This GridView extends the {@link Grommunio.common.ui.grid.MapiMessageGrid GridPanel} and
 * implements custom context menus.
 */
Grommunio.note.ui.NoteGrid = Ext.extend(Grommunio.common.ui.grid.MapiMessageGrid, {
	/**
	 * @cfg {Grommunio.note.NoteContext} context The context to which this panel belongs
	 */
	context: undefined,

	/**
	 * The {@link Grommunio.note.NoteContextModel} which is obtained from
	 * the {@link #context}.
	 *
	 * @property
	 * @type Grommunio.note.NoteContextModel
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

		Ext.applyIf(config, {
			id: 'note-gridview',
			ariaLabel: _('Notes list'),
			border: false,
			autoExpandColumn: 'subject',
			stateful: true,
			statefulRelativeDimensions: false,
			loadMask: this.initLoadMask(),
			viewConfig: this.initViewConfig(),
			selModel: this.initSelectionModel(),
			colModel: this.initColumnModel(),
			enableDragDrop: true,
			ddGroup: 'dd.mapiitem'
		});

		Grommunio.note.ui.NoteGrid.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Object} view config object
	 * @private
	 */
	initViewConfig: function()
	{
		return {
		};
	},

	/**
	 * creates and returns a selection model object, used in {@link Ext.grid.GridPanel.selModel selModel} config
	 * @return {Ext.grid.RowSelectionModel} selection model object
	 * @private
	 */
	initSelectionModel: function()
	{
		return new Ext.grid.RowSelectionModel({
			singleSelect: false,
			listeners: {
				scope: this,
				selectionchange: this.onSelectionChange
			}
		});
	},

	/**
	 * creates and returns a column model object, used in {@link Ext.grid.EditorGridPanel.colModel colModel} config
	 * @return {Ext.grid.ColumnModel} column model object
	 * @private
	 */
	initColumnModel: function()
	{
		return new Grommunio.note.ui.NoteGridColumnModel();
	},

	/**
	 * @return {Object} loas mask config object
	 * @private
	 */
	initLoadMask: function()
	{
		return {
			msg: _('Loading Notes') + '...'
		};
	},

	/**
	 * initialize events for the grid panel
	 * @private
	 */
	initEvents: function()
	{
		Grommunio.note.ui.NoteGrid.superclass.initEvents.call(this);

		this.on({
			'rowdblclick': this.onNoteRowDblClick,
			scope: this
		});
	},

	/**
	 * @private
	 * Handles a double-click on a note row.
	 *
	 * @param {Ext.grid.GridPanel} grid The grid panel.
	 * @param {Number} rowIndex The clicked row index.
	 * @param {Ext.EventObject} event The double-click event.
	 */
	onNoteRowDblClick: function(grid, rowIndex, event)
	{
		Grommunio.note.Actions.openNoteContent(grid.getSelectionModel().getSelected());
	},

	/**
	 * Event handler which is triggered when the {@link Grommunio.note.ui.NoteGrid NoteGrid}
	 * {@link Grommunio.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Grommunio.note.NoteModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange: function(selectionModel)
	{
		this.model.setSelectedRecords(selectionModel.getSelections());
	}
});

Ext.reg('grommunio.notegrid',Grommunio.note.ui.NoteGrid);
