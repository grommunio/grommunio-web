/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui');

Grommunio.plugins.files.ui.FilesRecordGridView = Ext.extend(Grommunio.common.ui.grid.GridPanel, {
	/**
	 * @cfg {Grommunio.plugins.files.FilesContext} context The context to which this context menu belongs.
	 */
	context : undefined,

	/**
	 * The {@link Grommunio.plugins.files.FilesContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Grommunio.plugins.files.FilesContextModel
	 */
	model: undefined,

	dropTarget: undefined,

	constructor: function (config) {
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			config.store = config.model.getStore();
		}

		config.store = Ext.StoreMgr.lookup(config.store);

		Ext.applyIf(config, {
			xtype                     : 'filesplugin.filesrecordgridview',
			ddGroup                   : 'dd.filesrecord',
			id                        : 'files-gridview',
			enableDragDrop            : true,
			border                    : false,
			stateful                  : true,
			statefulRelativeDimensions: false,
			loadMask                  : this.initLoadMask(),
			viewConfig                : this.initViewConfig(),
			sm                        : this.initSelectionModel(),
			cm                        : this.initColumnModel(),
			keys                      : {
				key    : Ext.EventObject.DELETE,
				handler: this.onKeyDelete,
				scope  : this
			}
		});
		Grommunio.plugins.files.ui.FilesRecordGridView.superclass.constructor.call(this, config);

	},

	initEvents: function () {
		Grommunio.plugins.files.ui.FilesRecordGridView.superclass.initEvents.call(this);

		this.mon(this, 'cellcontextmenu', this.onCellContextMenu, this);
		this.mon(this, 'rowbodycontextmenu', this.onRowBodyContextMenu, this);
		this.mon(this, 'rowdblclick', this.onRowDblClick, this);
		this.mon(this, 'afterrender', this.initDropTarget, this);

		this.mon(this.getSelectionModel(), 'rowselect', this.onRowSelect, this, {buffer: 1});
		this.mon(this.getSelectionModel(), 'selectionchange', this.onSelectionChange, this, {buffer: 1});

		this.mon(this.context, 'viewmodechange', this.onContextViewModeChange, this);
		this.onContextViewModeChange(this.context, this.context.getCurrentViewMode());
		this.mon(this.bwrap, 'drop', this.onDropItemToUpload, this);
	},

	initLoadMask: function () {
		return {
			msg: _('Loading files') + '...'
		};
	},

	initViewConfig: function () {
		return {

			enableRowBody: false,

			rowSelectorDepth: 15
		};
	},

	initSelectionModel: function () {
		return new Ext.grid.RowSelectionModel();
	},

	initColumnModel: function () {
		return new Grommunio.plugins.files.ui.FilesRecordGridColumnModel();
	},

	initDropTarget: function () {
		this.dropTarget = new Ext.dd.DropTarget(this.getEl(), {
			ddGroup   : 'dd.filesrecord',
			copy      : false,
			gridStore : this.getStore(),
			gridSM    : this.getSelectionModel(),
			notifyDrop: function (ddSource, e, data) {

				if (this.notifyOver(ddSource, e, data) !== this.dropAllowed) {
					return false;
				}

				var cellindex = ddSource.getDragData(e).rowIndex;
				var dropTarget = this.gridStore.getAt(cellindex);
				if (Ext.isDefined(cellindex) && dropTarget.get('type') === Grommunio.plugins.files.data.FileTypes.FOLDER) {

					Ext.each(data.selections, function (record) {
						record.setDisabled(true);
					});

					return Grommunio.plugins.files.data.Actions.moveRecords(data.selections, dropTarget, {hierarchyStore: this.gridStore.hierarchyStore});
				} else {
					return false;
				}
			},
			notifyOver: function (ddSource, e, data) {
				var cellindex = ddSource.getDragData(e).rowIndex;
				var ret = this.dropNotAllowed;

				if (Ext.isDefined(cellindex)) {
					var dropTarget = this.gridStore.getAt(cellindex);

					if (dropTarget.get('type') === Grommunio.plugins.files.data.FileTypes.FOLDER) {
						ret = this.dropAllowed;
					}

					Ext.each(data.selections, function (record) {
						var srcId = record.get("folder_id");
						var trgId = dropTarget.get("folder_id");
						if (srcId === trgId || record.get("filename") === ".." || trgId.slice(0, srcId.length) === srcId) {
							ret = this.dropNotAllowed;
							return false;
						}
					}, this);
				}

				return ret;
			},

			notifyEnter: function (ddSource, e, data) {
				return this.notifyOver(ddSource, e, data);
			}
		});

		this.getView().dragZone.onBeforeDrag = function (data, e) {
			var ret = true;
			var selectedRowInSelection = false;
			var selectedItem = data.grid.getStore().getAt(data.rowIndex);

			Ext.each(data.selections, function (record) {
				if (selectedItem.get("id") === record.get("id")) {
					selectedRowInSelection = true;
				}
				if (record.get("filename") === ".." || record.getDisabled()) {
					ret = false;
					return false;
				}
			});

			if (selectedRowInSelection) {
				return ret;
			} else {

				if (selectedItem.get("filename") === ".." || selectedItem.getDisabled()) {
					return false;
				} else {
					return true;
				}
			}
		}
	},

	/**
	 * Event handler for the 'drop' event which happens if the user drops a file
	 * from the desktop to the {@link #wrap} element.
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onDropItemToUpload : function (event)
	{
		event.stopPropagation();
		event.preventDefault();

		var files = event.browserEvent.target.files || event.browserEvent.dataTransfer.files;
		Grommunio.plugins.files.data.Actions.uploadAsyncItems(files, this.getStore());
	},

	onContextViewModeChange: function (context, newViewMode, oldViewMode) {
		var compact = newViewMode === Grommunio.plugins.files.data.ViewModes.RIGHT_PREVIEW;
		this.getColumnModel().setCompactView(compact);
	},

	onCellContextMenu: function (grid, rowIndex, cellIndex, event) {
		var sm = this.getSelectionModel();
		if (sm.hasSelection()) {
			if (!sm.isSelected(rowIndex)) {
				sm.clearSelections();
				sm.selectRow(rowIndex);
			}
		} else {
			sm.selectRow(rowIndex);
		}

		var records = sm.getSelections();
		var show = !records.some(function(record) {
			return record.getDisabled() === true
		}, this);

		if (show) {
			Grommunio.core.data.UIFactory.openDefaultContextMenu(records, {
				position: event.getXY(),
				context : this.context
			});
		}
	},

	onRowBodyContextMenu: function (grid, rowIndex, event)
	{
		this.onCellContextMenu(grid, rowIndex, -1, event);
	},

	/**
	 *
	 * @param grid
	 * @param rowIndex
	 */
	onRowDblClick: function (grid, rowIndex)
	{
		var store = this.getStore();
		var record = store.getAt(rowIndex);
		if (record.get('type') === Grommunio.plugins.files.data.FileTypes.FOLDER) {
			Grommunio.plugins.files.data.Actions.openFolder(this.model, record.get('entryid'));
		} else {
			Grommunio.plugins.files.data.Actions.openFile(record);
		}
	},

	onKeyDelete: function (key, event)
	{
		var selections = this.getSelectionModel().getSelections();
		Grommunio.plugins.files.data.Actions.deleteRecords(selections);
	},

	/**
	 * Event handler triggered when row was selected in grid.
	 * set single selected record in preview panel if view mode is
	 * other then no preview.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @param {Number} rowNumber The index of selected row.
	 * @param {Grommunio.plugins.files.data.FilesRecord} record The record which is selected.
	 */
	onRowSelect: function (selectionModel, rowNumber, record)
	{
		var viewMode = this.context.getCurrentViewMode();
		var count = selectionModel.getCount();
		if (viewMode === Grommunio.plugins.files.data.ViewModes.NO_PREVIEW || count > 1 || record.getDisabled()) {
			return;
		}
		if (count === 1) {
			var id = container.getSettingsModel().get('grommunio/v1/contexts/files/files_path') + "/";
			if (record.get('folder_id') !== id) {
				this.model.setPreviewRecord(record);
			}
			return;
		}
		this.model.setPreviewRecord(undefined);
	},

	/**
	 * Event handler triggered when selection gets changed in grid.
	 * It will set the selected record in preview panel. If selection
	 * is empty then clear the preview panel.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange: function (selectionModel)
	{
		var selections = selectionModel.getSelections();
		this.model.setSelectedRecords(!Ext.isEmpty(selections) ? selections : undefined);
	}
});

Ext.reg('filesplugin.filesrecordgridview', Grommunio.plugins.files.ui.FilesRecordGridView);
