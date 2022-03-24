Ext.namespace('Zarafa.plugins.files.ui');

Zarafa.plugins.files.ui.FilesRecordIconView = Ext.extend(Zarafa.common.ui.DraggableDataView, {
	/**
	 * @cfg {Zarafa.plugins.files.FilesContext} context The context to which this context menu belongs.
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.plugins.files.FilesContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.plugins.files.FilesContextModel
	 */
	model: undefined,

	dropTarget: undefined,

	keyMap: undefined,

	constructor: function (config) {
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}
		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			config.store = config.model.getStore();
		}

		config.store = Ext.StoreMgr.lookup(config.store);

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.icondragselectorplugin');

		Ext.applyIf(config, {
			xtype: 'filesplugin.filesrecordiconview',
			cls           : 'zarafa-files-iconview',
			loadingText   : dgettext('plugin_files', 'Loading files') + '...',
			deferEmptyText: false,
			autoScroll    : true,
			emptyText     : '<div class="emptytext">' + dgettext('plugin_files', 'There are no items to show in this view') + '</div>',
			overClass     : 'zarafa-files-iconview-over',
			tpl           : this.initTemplate(),
			multiSelect   : true,
			selectedClass : 'zarafa-files-iconview-selected',
			itemSelector  : 'div.zarafa-files-iconview-thumb',
			enableDragDrop: true,
			ddGroup       : 'dd.filesrecord'
		});

		Zarafa.plugins.files.ui.FilesRecordIconView.superclass.constructor.call(this, config);

		this.initEvents();
	},

	initTemplate: function () {
		return new Ext.XTemplate(
			'<div style="height: 100%; width: 100%; overflow: auto;">',
				'<tpl for=".">',
					'<div class="zarafa-files-iconview-thumb">',
						'<div class="zarafa-files-iconview-icon {.:this.getTheme} {.:this.getHidden}"></div>',
						'<div class="zarafa-files-iconview-subject">{filename:htmlEncode}</div>',
					'</div>',
				'</tpl>',
			'</div>',
			{
				getHidden: function (record) {
					if (record.filename === "..") {
						return "files_type_hidden";
					}
					return "";
				},
				getTheme: function (record) {
					switch (record.type) {
						case Zarafa.plugins.files.data.FileTypes.FOLDER:
							return Zarafa.plugins.files.data.Utils.File.getIconClass("folder");
							break;
						case Zarafa.plugins.files.data.FileTypes.FILE:
							return Zarafa.plugins.files.data.Utils.File.getIconClass(record.filename);
							break;
						default:
							return 'files48icon_blank';
							break;
					}
				}
			}
		);
	},

	initEvents: function ()
	{
		this.on({
			'contextmenu'    : this.onFilesIconContextMenu,
			'dblclick'       : this.onIconDblClick,
			'selectionchange': this.onSelectionChange,
			'afterrender'    : this.onAfterRender,
			scope            : this
		});

		this.mon(this.store, 'createfolder', this.onCreateFolder, this);
	},

	/**
	 * Event handler triggers when folder is record is created.
	 *
	 * @param {Zarafa.plugins.files.data.FilesRecordStore} store The store which fires this event.
	 * @param {String} parentFolderId The parentFolderId under which folder was created.
	 * @param {Object} data The data contains the information about newly created folder.
	 */
	onCreateFolder : function (store, parentFolderId, data)
	{
		if (store.getPath() === parentFolderId) {
			var record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_FILES, data);
			store.add(record);
			store.on("update", Zarafa.plugins.files.data.Actions.doRefreshIconView, Zarafa.plugins.files.data.Actions, {single: true});
			record.commit(true);
		}
	},

	onAfterRender: function ()
	{
		// Add key maps only while keyboard shortcut is enable
		if (Zarafa.core.KeyMapMgr.isGloballyEnabled()) {
			this.keyMap = new Ext.KeyMap(this.getEl(), {
				key: Ext.EventObject.DELETE,
				fn: this.onKeyDelete.createDelegate(this)
			});

			// Disable all other key maps for this element
			Zarafa.core.KeyMapMgr.disableAllKeymaps(this.getEl());
		}

		this.initDropTarget();
	},

	onKeyDelete: function (key, event) {
		var selections = this.getSelectedRecords();
		Zarafa.plugins.files.data.Actions.deleteRecords(selections);
	},

	initDropTarget: function () {
		var iconViewDropTargetEl = this.getEl();

		var wrap = iconViewDropTargetEl.wrap({cls: 'x-form-field-wrap'});
		this.mon(wrap, 'drop', this.onDropItemToUpload, this);

		this.dropTarget = new Ext.dd.DropTarget(iconViewDropTargetEl, {
			ddGroup    : 'dd.filesrecord',
			copy       : false,
			fileStore  : this.getStore(),
			model: this.model,
			notifyDrop : function (ddSource, e, data) {

				if (this.notifyOver(ddSource, e, data) !== this.dropAllowed) {
					return false;
				}

				var dragData = ddSource.getDragData(e);

				if (Ext.isDefined(dragData)) {
					var cellindex = dragData.index;
					var dropTarget = this.fileStore.getAt(cellindex);
					if (Ext.isDefined(cellindex) && dropTarget.get('type') === Zarafa.plugins.files.data.FileTypes.FOLDER) {

						Ext.each(data.selections, function (record) {
							record.setDisabled(true);
						});
						return Zarafa.plugins.files.data.Actions.moveRecords(data.selections, dropTarget, {hierarchyStore: this.model.getHierarchyStore()});
					}
				}

				return false;
			},
			notifyOver : function (ddSource, e, data) {
				var dragData = ddSource.getDragData(e);
				var ret = this.dropNotAllowed;

				if (Ext.isDefined(dragData)) {
					var cellindex = dragData.index;

					if (Ext.isDefined(cellindex)) {
						var dropTarget = this.fileStore.getAt(cellindex);

						if (dropTarget.get('type') === Zarafa.plugins.files.data.FileTypes.FOLDER) {
							ret = this.dropAllowed;
						}

						Ext.each(data.selections, function (record) {
							var srcId = record.get("id");
							var trgId = dropTarget.get("id");
							if (srcId === trgId || record.get("filename") === ".." || trgId.slice(0, srcId.length) === srcId) {
								ret = this.dropNotAllowed;
								return false;
							}
						}, this);
					}
				}
				return ret;
			},
			notifyEnter: function (ddSource, e, data) {
				return this.notifyOver(ddSource, e, data);
			}
		});

		this.dragZone.onBeforeDrag = function (data, e) {
			var ret = true;
			var selectedRowInSelection = false;
			var selectedItem = this.view.getStore().getAt(data.index);

			Ext.each(data.selections, function (record) {
				if (selectedItem.get("id") === record.get("id")) {
					selectedRowInSelection = true;
				}
				if (record.getDisabled()) {
					ret = false;
					return false;
				}
			});

			if (selectedRowInSelection) {
				return ret;
			} else {

				if (selectedItem.getDisabled()) {
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
		Zarafa.plugins.files.data.Actions.uploadAsyncItems(files, this.getStore());
	},

	onFilesIconContextMenu: function (dataview, index, node, eventObj) {

		if (!dataview.isSelected(node)) {
			dataview.select(node);
		}

		var records = dataview.getSelectedRecords();

		var show = true;
		Ext.each(records, function (record) {
			if (record.getDisabled() === true) {
				show = false;
				return;
			}
		});

		if (show) {
			Zarafa.core.data.UIFactory.openDefaultContextMenu(records, {
				position: eventObj.getXY(),
				context : this.context
			});
		}
	},

	onIconDblClick: function (dataview, index, node, event)
	{
		var store = this.getStore();
		var record = store.getAt(index);
		if (record.get('type') === Zarafa.plugins.files.data.FileTypes.FOLDER) {
			Zarafa.plugins.files.data.Actions.openFolder(this.model, record.get('entryid'));
		} else {
			Zarafa.plugins.files.data.Actions.downloadItem(record);
		}
	},

	onSelectionChange: function (dataView, selections) {
		var records = dataView.getSelectedRecords();

		// FIXME: In Webapp context who contains the dataViews are not statefulRecordSelection but in files context
		//  we have preview panel and because of that we need to make file context model statefulRecordSelection to true.
		//  here we face an issue when we delete more than one record from icon views because onSelectionChange function
		//  also called to deselect the record. when record was deleted at that time dataView.getSelectedRecords returns
		//  an array whose first element value is undefined because getSelectedRecords gets the record by using viewIndex
		//  from store and at this time length of records was changed due to first deletion and because of that it will give
		//  undefined as first element of an array.
		records = records.filter(function(record) {
			return Ext.isDefined(record);
		}, this);

		this.model.setSelectedRecords(records, false);

		var viewMode = this.context.getCurrentViewMode();
		var count = records.length;

		if (viewMode !== Zarafa.plugins.files.data.ViewModes.NO_PREVIEW) {
			if (count !== 1) {
				this.model.setPreviewRecord(undefined);
			} else if (count == 1) {
				if (records[0].get('folder_id') !== (container.getSettingsModel().get('zarafa/v1/contexts/files/files_path') + "/") && records[0].get('filename') !== "..") {
					this.model.setPreviewRecord(records[0]);
				} else {
					this.model.setPreviewRecord(undefined);
				}
			}
		}
	}
});

Ext.reg('filesplugin.filesrecordiconview', Zarafa.plugins.files.ui.FilesRecordIconView);
