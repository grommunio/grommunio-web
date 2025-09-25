Ext.namespace('Zarafa.plugins.files.backend.Default.data.singleton');

/**
 * @class Zarafa.plugins.files.backend.Default.data.singleton.ShareStore
 * @extends Object
 *
 * This singleton provides access to the {@link Zarafa.plugins.files.backend.Default.data.ShareGridStore ShareGridStore}.
 * It must be initialized once by calling the init method.
 */
Zarafa.plugins.files.backend.Default.data.singleton.ShareStore = Ext.extend(
	Object,
	{
		/**
		 * @property
		 * @type Zarafa.plugins.files.data.AccountStore
		 * @private
		 */
		store: undefined,

		/**
		 * Triggers a call to the backend to load version information.
		 * @param {Number} fileType folder or file
		 */
		init: function (fileType) {
			this.store = new Zarafa.plugins.files.backend.Default.data.ShareGridStore(
				fileType,
			);
		},

		/**
		 * Loads userdata to the store.
		 *
		 * @param {Object} shareOpts object with the sharing options
		 * Possible values of shareOpts are:
		 * - id: the id oof the share
		 * - shareWith: ownclouds internal user identifier
		 * - shareWithDisplayname: the shareusers displayname
		 * - permissions: bytecode presentation of the chare permissions
		 * - shareType: type of the share, one of Zarafa.plugins.files.backend.Default.data.RecipientTypes
		 */
		addUser: function (shareOpts) {
			var permissionCreate = false;
			var permissionChange = false;
			var permissionDelete = false;
			var permissionShare = false;

			// parse the permission number
			if (shareOpts.permissions - 16 >= 1) {
				permissionShare = true;
				shareOpts.permissions -= 16;
			}
			if (shareOpts.permissions - 8 >= 1) {
				permissionDelete = true;
				shareOpts.permissions -= 8;
			}
			if (shareOpts.permissions - 4 >= 1) {
				permissionCreate = true;
				shareOpts.permissions -= 4;
			}
			if (shareOpts.permissions - 2 >= 1) {
				permissionChange = true;
			}

			var record = [
				shareOpts.id,
				shareOpts.shareWith,
				shareOpts.shareWithDisplayname,
				'user',
				permissionCreate,
				permissionChange,
				permissionDelete,
				permissionShare,
			];

			this.store.loadData([record], true);
		},

		/**
		 * Loads groupdata to the store.
		 *
		 * @param {Object} shareOpts object with the sharing options
		 * Possible values of shareOpts are:
		 * - id: the id oof the share
		 * - shareWith: ownclouds internal user identifier
		 * - shareWithDisplayname: the shareusers displayname
		 * - permissions: bytecode presentation of the chare permissions
		 * - shareType: type of the share, one of Zarafa.plugins.files.backend.Default.data.RecipientTypes
		 */
		addGroup: function (shareOpts) {
			var permissionCreate = false;
			var permissionChange = false;
			var permissionDelete = false;
			var permissionShare = false;

			// parse the permission number
			if (shareOpts.permissions - 16 >= 1) {
				permissionShare = true;
				shareOpts.permissions -= 16;
			}
			if (shareOpts.permissions - 8 >= 1) {
				permissionDelete = true;
				shareOpts.permissions -= 8;
			}
			if (shareOpts.permissions - 4 >= 1) {
				permissionCreate = true;
				shareOpts.permissions -= 4;
			}
			if (shareOpts.permissions - 2 >= 1) {
				permissionChange = true;
			}

			var record = [
				shareOpts.id,
				shareOpts.shareWith,
				shareOpts.shareWithDisplayname,
				'group',
				permissionCreate,
				permissionChange,
				permissionDelete,
				permissionShare,
			];

			this.store.loadData([record], true);
		},

		/**
		 * Get instance of the {@link Zarafa.plugins.files.data.AccountStore Accountstore}
		 * @return {Zarafa.plugins.files.data.AccountStore} the account store
		 */
		getStore: function () {
			return this.store;
		},
	},
);

// Make it a Singleton
Zarafa.plugins.files.backend.Default.data.singleton.ShareStore =
	new Zarafa.plugins.files.backend.Default.data.singleton.ShareStore();
Ext.namespace('Zarafa.plugins.files.backend.Default.data');

/**
 * @class Zarafa.plugins.files.backend.Default.data.ShareGridStore
 * @extends Ext.data.ArrayStore
 * @xtype filesplugin.default.sharegridstore
 *
 * This simple array store holds all group and user shares. Do not use the save or commit method as
 * the store does not implement a writer.
 */
Zarafa.plugins.files.backend.Default.data.ShareGridStore = Ext.extend(
	Ext.data.ArrayStore,
	{
		/**
		 * @constructor
		 */
		constructor: function (fileType) {
			Zarafa.plugins.files.backend.Default.data.ShareGridStore.superclass.constructor.call(
				this,
				{
					fields: [
						'id',
						'shareWith',
						'shareWithDisplayname',
						'type',
						'permissionCreate',
						'permissionChange',
						'permissionDelete',
						'permissionShare',
					],
					fileType: fileType,
				},
			);
		},
	},
);

Ext.reg(
	'filesplugin.default.sharegridstore',
	Zarafa.plugins.files.backend.Default.data.ShareGridStore,
);
Ext.namespace('Zarafa.plugins.files.backend.Default.data');

/**
 * @class Zarafa.plugins.files.backend.Default.data.RecipientTypes
 * @extends Zarafa.core.Enum
 *
 * Enum containing the different recipient types that are available in the owncloud backend.
 *
 * @singleton
 */
Zarafa.plugins.files.backend.Default.data.RecipientTypes =
	Zarafa.core.Enum.create({
		/**
		 * RecipientType: user
		 *
		 * @property
		 * @type Number
		 */
		USER: 0,

		/**
		 * RecipientType: group
		 *
		 * @property
		 * @type Number
		 */
		GROUP: 1,

		/**
		 * RecipientType: link
		 *
		 * @property
		 * @type Number
		 */
		LINK: 3,
	});
Ext.namespace('Zarafa.plugins.files.backend.Default.data');

/**
 * @class Zarafa.plugins.files.backend.Default.data.ResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 * @xtype filesplugin.default.responsehandler
 *
 * Files plugin specific response handler.
 */
Zarafa.plugins.files.backend.Default.data.ResponseHandler = Ext.extend(
	Zarafa.core.data.AbstractResponseHandler,
	{
		/**
		 * @cfg {Function} successCallback The function which
		 * will be called after success request.
		 */
		successCallback: null,

		/**
		 * @cfg {Function} failureCallback The function which
		 * will be called after a failed request.
		 */
		failureCallback: null,

		/**
		 * Call the successCallback callback function.
		 *
		 * @param {Object} response Object contained the response data.
		 */
		doLoadsharingdetails: function (response) {
			this.successCallback(response);
		},

		/**
		 * Call the successCallback callback function.
		 *
		 * @param {Object} response Object contained the response data.
		 */
		doCreatenewshare: function (response) {
			this.successCallback(response);
		},

		/**
		 * Call the successCallback callback function.
		 *
		 * @param {Object} response Object contained the response data.
		 */
		doDeleteexistingshare: function (response) {
			this.successCallback(response);
		},

		/**
		 * Call the successCallback callback function.
		 *
		 * @param {Object} response Object contained the response data.
		 */
		doUpdateexistingshare: function (response) {
			this.successCallback(response);
		},

		/**
		 * In case exception happened on server, server will return
		 * exception response with the code of exception.
		 *
		 * @param {Object} response Object contained the response data.
		 */
		doError: function (response) {
			Zarafa.common.dialogs.MessageBox.show({
				title: response.header,
				msg: response.message,
				icon: Zarafa.common.dialogs.MessageBox.ERROR,
				buttons: Zarafa.common.dialogs.MessageBox.OK,
			});
			this.failureCallback(response);
		},
	},
);

Ext.reg(
	'filesplugin.default.responsehandler',
	Zarafa.plugins.files.backend.Default.data.ResponseHandler,
);
Ext.namespace('Zarafa.plugins.files.backend.Default.data');

/**
 * @class Zarafa.plugins.files.backend.Default.data.ShareGridRecord
 *
 * This class specifies the ShareGridRecord and it's fields.
 */
Zarafa.plugins.files.backend.Default.data.ShareGridRecord =
	Ext.data.Record.create(
		{ name: 'id', type: 'string' },
		{ name: 'shareWith', type: 'string' },
		{ name: 'shareWithDisplayname', type: 'string' },
		{ name: 'type', type: 'string' },
		{ name: 'permissionCreate', type: 'bool' },
		{ name: 'permissionChange', type: 'bool' },
		{ name: 'permissionDelete', type: 'bool' },
		{ name: 'permissionShare', type: 'bool' },
	);
Ext.namespace('Zarafa.plugins.files.backend.Default');

/**
 *
 * @class Zarafa.plugins.files.backend.Default.DefaultBackend
 * @extends Zarafa.core.Plugin
 *
 * Plugin for the default WebDAV backend. It requires the main files plugin.
 */
Zarafa.plugins.files.backend.Default.DefaultBackend = Ext.extend(
	Zarafa.core.Plugin,
	{
		/**
		 * Constructor
		 * @protected
		 */
		constructor: function (config) {
			config = config || {};

			Zarafa.plugins.files.backend.Default.DefaultBackend.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Initialize all insertion points.
		 */
		initPlugin: function () {
			Zarafa.plugins.files.backend.Default.DefaultBackend.superclass.initPlugin.apply(
				this,
				arguments,
			);

			this.registerInsertionPoint(
				'plugin.files.sharedialog',
				this.createShareDialogInsertionPoint,
				this,
			);

			// Register common specific dialog types
			Zarafa.core.data.SharedComponentType.addProperty(
				'filesplugin.default.useredit',
			);
		},

		/**
		 * Callback for the plugin.files.sharedialog insertion point.
		 *
		 * @return {{xtype: string}}
		 */
		createShareDialogInsertionPoint: function () {
			return {
				xtype: 'filesplugin.default.filessharedialogpanel',
			};
		},

		/**
		 * Bid for the type of shared component
		 * and the given record.
		 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
		 * @param {Ext.data.Record} record Optionally passed record.
		 * @return {Number} The bid for the shared component
		 */
		bidSharedComponent: function (type, record) {
			var bid = -1;
			switch (type) {
				case Zarafa.core.data.SharedComponentType[
					'filesplugin.default.useredit'
				]:
					bid = 1;
					break;
			}
			return bid;
		},

		/**
		 * Will return the reference to the shared component.
		 * Based on the type of component requested a component is returned.
		 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
		 * @param {Ext.data.Record} record Optionally passed record.
		 * @return {Ext.Component} Component
		 */
		getSharedComponent: function (type, record) {
			var component;
			switch (type) {
				case Zarafa.core.data.SharedComponentType[
					'filesplugin.default.useredit'
				]:
					component =
						Zarafa.plugins.files.backend.Default.ui
							.FilesShareUserEditContentPanel;
					break;
			}

			return component;
		},
	},
);

// Register plugin
Zarafa.onReady(function () {
	container.registerPlugin(
		new Zarafa.core.PluginMetaData({
			name: 'filesbackendDefault', // this name must be in format "filesbackend<Backendname>"
			displayName: _('Files: Default plugin'),
			allowUserDisable: false, // don't allow to disable this plugin - files will get confused if it is disabled
			pluginConstructor: Zarafa.plugins.files.backend.Default.DefaultBackend,
		}),
	);
});
Ext.namespace('Zarafa.plugins.files.backend.Default.ui');

/**
 * @class Zarafa.plugins.files.backend.Default.ui.FilesShareUserGrid
 * @extends Ext.grid.GridPanel
 * @xtype filesplugin.default.filesshareusergrid
 *
 * The main gridpanel for our share list. It will display user and group shares.
 */
Zarafa.plugins.files.backend.Default.ui.FilesShareUserGrid = Ext.extend(
	Ext.grid.GridPanel,
	{
		/**
		 * @cfg {Object} The account store.
		 */
		store: undefined,

		/**
		 * @cfg {Number} The parent record id
		 */
		recordId: undefined,

		/**
		 * @constructor
		 * @param {Object} config
		 */
		constructor: function (config) {
			config = config || {};

			this.store =
				Zarafa.plugins.files.backend.Default.data.singleton.ShareStore.getStore();

			Ext.applyIf(config, {
				xtype: 'filesplugin.default.filesshareusergrid',
				ref: 'sharegrid',
				store: this.store,
				border: false,
				baseCls: 'shareGrid',
				enableHdMenu: false,
				loadMask: this.initLoadMask(),
				viewConfig: this.initViewConfig(),
				sm: this.initSelectionModel(),
				cm: this.initColumnModel(),
				listeners: {
					rowdblclick: this.onRowDblClick,
					scope: this,
				},
				tbar: [
					{
						iconCls: 'filesplugin_icon_add',
						text: _('Add'),
						handler: this.onAdd.createDelegate(this),
					},
					'-',
					{
						iconCls: 'filesplugin_icon_delete',
						text: _('Delete'),
						ref: '../removeAccountBtn',
						disabled: true,
						handler: this.onDelete.createDelegate(this),
					},
				],
			});

			Zarafa.plugins.files.backend.Default.ui.FilesShareUserGrid.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Initialize the {@link Ext.grid.GridPanel.loadMask} field.
		 *
		 * @return {Ext.LoadMask} The configuration object for {@link Ext.LoadMask}
		 * @private
		 */
		initLoadMask: function () {
			return {
				msg: _('Loading users and groups') + '...',
			};
		},

		/**
		 * Initialize the {@link Ext.grid.GridPanel#viewConfig} field.
		 *
		 * @return {Ext.grid.GridView} The configuration object for {@link Ext.grid.GridView}
		 * @private
		 */
		initViewConfig: function () {
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

			return {
				enableRowBody: false,
				forceFit: true,
				emptyText:
					"<div class='emptytext'>" +
					_('Add users or groups to share files.') +
					'</div>',
				deferEmptyText: false,
			};
		},

		/**
		 * Initialize the {@link Ext.grid.GridPanel.sm SelectionModel} field.
		 *
		 * @return {Ext.grid.RowSelectionModel} The subclass of {@link Ext.grid.AbstractSelectionModel}
		 * @private
		 */
		initSelectionModel: function () {
			return new Ext.grid.RowSelectionModel({
				singleSelect: true,
				listeners: {
					selectionchange: this.onRowSelected,
				},
			});
		},

		/**
		 * Initialize the {@link Ext.grid.GridPanel.cm ColumnModel} field.
		 *
		 * @return {Ext.grid.ColumnModel} The {@link Ext.grid.ColumnModel} for this grid
		 * @private
		 */
		initColumnModel: function () {
			return new Zarafa.plugins.files.backend.Default.ui.FilesShareUserGridColumnModel(
				{ fileType: this.store.fileType },
			);
		},

		/**
		 * Function is called if a row in the grid gets selected.
		 *
		 * @param selectionModel
		 * @private
		 */
		onRowSelected: function (selectionModel) {
			var remButton = this.grid.removeAccountBtn;
			remButton.setDisabled(selectionModel.getCount() != 1);
		},

		/**
		 * Eventhandler that is triggered if a grid row gets double clicked. It will open the user edit dialog.
		 *
		 * @param grid the grid holding the share records
		 * @param rowIndex index of the currently selected record
		 */
		onRowDblClick: function (grid, rowIndex) {
			Zarafa.core.data.UIFactory.openLayerComponent(
				Zarafa.core.data.SharedComponentType['filesplugin.default.useredit'],
				undefined,
				{
					store: grid.getStore(),
					record: grid.getStore().getAt(rowIndex),
					manager: Ext.WindowMgr,
					recordId: this.recordId,
				},
			);
		},

		/**
		 * Eventhandler for the add button. It will create a new grid entry and starts the editor for the newly created
		 * entry.
		 *
		 * @param btn
		 * @param event
		 * @private
		 */
		onAdd: function (btn, event) {
			Zarafa.core.data.UIFactory.openLayerComponent(
				Zarafa.core.data.SharedComponentType['filesplugin.default.useredit'],
				undefined,
				{
					store: this.store,
					manager: Ext.WindowMgr,
					recordId: this.recordId,
				},
			);
		},

		/**
		 * Eventhandler for the delete button. It will remove the selected record from the grid.
		 *
		 * @param button
		 * @param event
		 * @private
		 */
		onDelete: function (button, event) {
			var rec = this.getSelectionModel().getSelected();
			if (!rec) {
				return false;
			}
			this.store.remove(rec);
		},
	},
);

Ext.reg(
	'filesplugin.default.filesshareusergrid',
	Zarafa.plugins.files.backend.Default.ui.FilesShareUserGrid,
);
Ext.namespace('Zarafa.plugins.files.backend.Default.ui');

/**
 * @class Zarafa.plugins.files.backend.Default.ui.FilesShareUserGridColumnModel
 * @extends Zarafa.common.ui.grid.ColumnModel
 *
 * The Column model for the share grid.
 */
Zarafa.plugins.files.backend.Default.ui.FilesShareUserGridColumnModel =
	Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
		/**
		 * @constructor
		 * @param config Configuration structure
		 */
		constructor: function (config) {
			config = config || {};

			this.defaultColumns = this.createDefaultColumns(config.fileType);

			Ext.applyIf(config, {
				columns: this.defaultColumns,
				defaults: {
					sortable: true,
				},
			});
			Ext.apply(this, config);

			Zarafa.plugins.files.backend.Default.ui.FilesShareUserGridColumnModel.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Create an array of {@link Ext.grid.Column columns} which must be visible within
		 * the default view of this {@link Ext.grid.ColumnModel ColumnModel}.
		 * @param {Zarafa.plugins.files.data.FileTypes} fileType folder or file
		 * @return {Ext.grid.Column[]} The array of columns
		 * @private
		 */
		createDefaultColumns: function (fileType) {
			var columns = [
				{
					header: _('Name'),
					dataIndex: 'shareWithDisplayname',
					flex: 1,
					sortable: true,
					tooltip: _('Sort by: Name'),
				},
				{
					header: _('Type'),
					dataIndex: 'type',
					flex: 1,
					align: 'center',
					sortable: true,
					renderer: this.shareTypeRenderer,
					tooltip: _('Sort by: Type'),
				},
				{
					header: _('Re-share'),
					dataIndex: 'permissionShare',
					flex: 1,
					align: 'center',
					sortable: false,
					renderer: this.yesNoRenderer,
				},
				{
					header: _('Change'),
					dataIndex: 'permissionChange',
					flex: 1,
					align: 'center',
					sortable: false,
					renderer: this.yesNoRenderer,
				},
			];
			if (fileType === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				columns.push(
					{
						header: _('Create'),
						dataIndex: 'permissionCreate',
						flex: 1,
						align: 'center',
						sortable: false,
						renderer: this.yesNoRenderer,
					},
					{
						header: _('Delete'),
						dataIndex: 'permissionDelete',
						flex: 1,
						align: 'center',
						sortable: false,
						renderer: this.yesNoRenderer,
					},
				);
			}
			return columns;
		},

		/**
		 * This renderer will render the type column. It will set the css class either to group or user.
		 *
		 * @param value
		 * @param p
		 * @param record
		 * @return {string}
		 */
		shareTypeRenderer: function (value, p, record) {
			p.css = 'shareicon_16_' + value;

			// add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';

			return '';
		},

		/**
		 * This renderer will render the boolean columns.
		 * It will show nice icons for true and false.
		 *
		 * @param value
		 * @param p
		 * @param record
		 * @return {string}
		 */
		yesNoRenderer: function (value, p, record) {
			if (value) {
				p.css = 'shareicon_16_yes';
			} else {
				p.css = 'shareicon_16_no';
			}

			// add extra css class for empty cell
			p.css += ' zarafa-grid-empty-cell';

			return '';
		},
	});
Ext.namespace('Zarafa.plugins.files.backend.Default.ui');

/**
 * @class Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel
 * @extends Ext.form.FormPanel
 * @xtype filesplugin.default.filesshareusereditpanel
 *
 * This content panel contains the sharing edit panel.
 */
Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel = Ext.extend(
	Ext.form.FormPanel,
	{
		/**
		 * @cfg {Ext.record} Ext.record to be edited
		 */
		record: undefined,

		/**
		 * @cfg {Ext.data.arrayStore} store holding the user and group share data
		 */
		store: undefined,

		/**
		 * @cfg {String} record id of the parent files record
		 */
		recordId: undefined,

		/**
		 * @constructor
		 * @param config
		 */
		constructor: function (config) {
			if (config.record) {
				this.record = config.record;
			}

			if (config.store) {
				this.store = config.store;
			}

			if (config.recordId) {
				this.recordId = config.recordId;
			}

			Ext.applyIf(config || {}, {
				labelAlign: 'left',
				defaultType: 'textfield',
				items: this.createPanelItems(),
				buttons: [
					{
						text: _('Save'),
						handler: this.doSave,
						scope: this,
					},
					{
						text: _('Cancel'),
						handler: this.doClose,
						scope: this,
					},
				],
			});

			Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Eventhandler for the Cancel button, closing this dialog
		 */
		doClose: function () {
			this.ownerCt.dialog.close();
		},

		/**
		 * Save the share data to the share gridstore.
		 * Create a new record or update an existing one.
		 */
		doSave: function () {
			var recipientRecord = this.shareWith
				.getStore()
				.getAt(this.shareWith.selectedIndex);
			if (this.record) {
				this.record.beginEdit();
				// When we have a recipientRecord here, this means the user has refreshed or changed it.
				// Otherwise we just keep the original values and update the permissions.
				if (recipientRecord) {
					this.record.set('type', this.type.getValue());
					this.record.set('shareWith', recipientRecord.data.shareWith);
					this.record.set(
						'shareWithDisplayname',
						recipientRecord.data.display_name,
					);
				}
				this.record.set('permissionShare', this.permissionShare.getValue());
				this.record.set('permissionChange', this.permissionChange.getValue());
				this.record.set(
					'permissionCreate',
					this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
						? this.permissionCreate.getValue()
						: false,
				);
				this.record.set(
					'permissionDelete',
					this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
						? this.permissionDelete.getValue()
						: false,
				);
				this.record.endEdit();
			} else {
				var record = new this.store.recordType({
					id: -1,
					type: this.type.getValue(),
					shareWith: recipientRecord.data.shareWith,
					shareWithDisplayname: recipientRecord.data.display_name,
					permissionCreate:
						this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
							? this.permissionCreate.getValue()
							: false,
					permissionChange: this.permissionChange.getValue(),
					permissionDelete:
						this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
							? this.permissionDelete.getValue()
							: false,
					permissionShare: this.permissionShare.getValue(),
				});
				this.store.add(record);
			}
			this.ownerCt.dialog.close();
		},

		/**
		 * Function will create panel items for {@link Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel FilesShareUserEditPanel}
		 * @return {Array} array of items that should be added to panel.
		 * @private
		 */
		createPanelItems: function () {
			var type = 'user'; // user or group
			var shareWith = ''; // user/group name
			var shareWithDisplayname = ''; // user/group displayname
			var permissionCreate = false;
			var permissionChange = false;
			var permissionDelete = false;
			var permissionShare = false;
			if (this.record) {
				type = this.record.get('type');
				shareWith = this.record.get('shareWith');
				shareWithDisplayname = this.record.get('shareWithDisplayname');
				permissionShare = this.record.get('permissionShare');
				permissionChange = this.record.get('permissionChange');
				if (
					this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
				) {
					permissionCreate = this.record.get('permissionCreate');
					permissionDelete = this.record.get('permissionDelete');
				}
			}

			var permissionItems = [
				{
					xtype: 'checkbox',
					fieldLabel: _('Re-share'),
					name: 'permissionShare',
					ref: '../permissionShare',
					checked: permissionShare,
				},
				{
					xtype: 'checkbox',
					fieldLabel: _('Change'),
					name: 'permissionChange',
					ref: '../permissionChange',
					checked: permissionChange,
				},
			];
			if (this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				permissionItems.push(
					{
						xtype: 'checkbox',
						fieldLabel: _('Create'),
						name: 'permissionCreate',
						ref: '../permissionCreate',
						checked: permissionCreate,
					},
					{
						xtype: 'checkbox',
						fieldLabel: _('Delete'),
						name: 'permissionDelete',
						ref: '../permissionDelete',
						checked: permissionDelete,
					},
				);
			}

			return [
				{
					xtype: 'filesplugin.default.usergrouppredictorfield',
					fieldLabel: _('Share with'),
					name: 'shareWith',
					ref: 'shareWith',
					allowBlank: false,
					value: shareWithDisplayname,
					recordId: this.recordId,
				},
				{
					xtype: 'selectbox',
					fieldLabel: _('Type'),
					name: 'type',
					ref: 'type',
					allowBlank: false,
					value: type,
					store: [
						['user', 'User'],
						['group', 'Group'],
					],
					mode: 'local',
				},
				{
					xtype: 'fieldset',
					title: _('Permissions'),
					defaults: {
						labelWidth: 89,
						anchor: '100%',
						xtype: 'textfield',
					},
					items: permissionItems,
				},
			];
		},
	},
);

Ext.reg(
	'filesplugin.default.filesshareusereditpanel',
	Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel,
);
Ext.namespace('Zarafa.plugins.files.backend.Default.ui');

/**
 * @class Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype filesplugin.default.filesshareusereditcontentpanel
 *
 * This content panel contains the sharing edit panel.
 */
Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel =
	Ext.extend(Zarafa.core.ui.ContentPanel, {
		/**
		 * The load mask for this content panel
		 * @property
		 * @type Ext.LoadMask
		 */
		loadMask: undefined,

		/**
		 * @constructor
		 * @param config
		 */
		constructor: function (config) {
			Ext.applyIf(config, {
				layout: 'fit',
				title: _('Share Details'),
				closeOnSave: true,
				model: true,
				autoSave: false,
				width: 550,
				height: 445,
				items: {
					xtype: 'filesplugin.default.filesshareusereditpanel',
					record: config.record,
					store: config.store,
					recordId: config.recordId,
				},
			});
			Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel.superclass.constructor.call(
				this,
				config,
			);
		},
	});

Ext.reg(
	'filesplugin.default.filesshareusereditcontentpanel',
	Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditContentPanel,
);
Ext.namespace('Zarafa.plugins.files.backend.Default.ui');

/**
 * @class Zarafa.plugins.files.backend.Default.ui.UserGroupPredictorField
 * @extends Ext.form.ComboBox
 * @xtype filesplugin.default.usergrouppredictorfield
 *
 * This ComboBox automatically searches for the correct user/group name.
 */
Zarafa.plugins.files.backend.Default.ui.UserGroupPredictorField = Ext.extend(
	Ext.form.ComboBox,
	{
		/**
		 * @constructor
		 * @param config
		 */
		constructor: function (config) {
			var recipientStore = new Ext.data.ArrayStore({
				proxy: new Ext.data.HttpProxy({
					method: 'GET',
					url: container.getBasePath() + 'index.php',
				}),
				method: 'GET',
				baseParams: {
					load: 'custom',
					name: 'files_get_recipients',
					id: config.recordId,
				},
				id: 1,
				fields: ['display_name', 'shareWith', 'object_type'],
			});
			config = config || {};
			Ext.applyIf(config, {
				store: recipientStore,
				displayField: 'display_name',
				typeAhead: false,
				forceSelection: true,
				triggerAction: 'query',
				itemId: 'predictor',
				mode: 'remote',
				minChars: 2,
				emptyText: _('Type to search'),
				loadingText: _('Loading…'),
				listEmptyText: _('No results'),
				itemSelector: 'div.ugpredic_search_item',
				tpl: new Ext.XTemplate(
					'<tpl for=".">',
					'<div class="ugpredic_search_item">',
					'<h3>',
					'<tpl if="object_type == Zarafa.plugins.files.backend.Default.data.RecipientTypes.USER"><span><div class="shareicon_16_user">&nbsp;</div></span></tpl>',
					'<tpl if="object_type == Zarafa.plugins.files.backend.Default.data.RecipientTypes.GROUP"><span><div class="shareicon_16_group">&nbsp;</div></span></tpl>',
					'{display_name:htmlEncode}',
					'</h3>',
					'</div>',
					'</tpl>',
					'</tpl>',
				),
				onSelect: this.onSuggestionSelect,
				listeners: {
					invalid: this.onInvalid,
					scope: this,
				},
			});

			Zarafa.plugins.files.backend.Default.ui.UserGroupPredictorField.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * OnSelect handler for the userGroupPredictor combo box
		 * @param record the selected record
		 */
		onSuggestionSelect: function (record) {
			this.setRawValue(record.get('display_name'));
			// also set the group field
			this.ownerCt['type'].setValue(
				record.get('object_type') ==
					Zarafa.plugins.files.backend.Default.data.RecipientTypes.USER
					? 'user'
					: 'group',
			);
			this.collapse();
		},

		/**
		 * Function which is fire after the field has been marked as invalid.
		 * It will collapse suggestions list if it's open.
		 */
		onInvalid: function () {
			if (this.isExpanded()) {
				this.store.removeAll();
				this.collapse();
			}
		},
	},
);

Ext.reg(
	'filesplugin.default.usergrouppredictorfield',
	Zarafa.plugins.files.backend.Default.ui.UserGroupPredictorField,
);
Ext.namespace('Zarafa.plugins.files.backend.Default.ui');

/**
 * @class Zarafa.plugins.files.backend.Default.ui.FilesShareDialogPanel
 * @extends Zarafa.plugins.files.ui.dialogs.SharePanel
 * @xtype filesplugin.default.filessharedialogpanel
 *
 * The panel contains all logic and UI elements that are needed for the OCS sharing functionality.
 */
Zarafa.plugins.files.backend.Default.ui.FilesShareDialogPanel = Ext.extend(
	Zarafa.plugins.files.ui.dialogs.SharePanel,
	{
		/**
		 * The loading mask of this panel
		 * @property
		 * @type Ext.LoadMask
		 */
		loadMask: undefined,

		/**
		 * Flag for the password field
		 * @property
		 * @type bool
		 */
		passwordChanged: false,

		/**
		 * Flag for the date field
		 * @property
		 * @type bool
		 */
		expirationDateChanged: false,

		/**
		 * Flag for the edit checkbox
		 * @property
		 * @type bool
		 */
		pubUploadChanged: false,

		/**
		 * The id of the linkshare, -1 if no linkshare is set
		 * @property
		 * @type Number
		 */
		linkShareID: -1,

		/**
		 * Id of the files record
		 * @property
		 * @type Number
		 */
		recordId: undefined,

		/**
		 * Parent files record
		 * @property
		 * @type {Ext.record}
		 */
		parentRecord: undefined,

		/**
		 * Constructor - init store and UI
		 *
		 * @constructor
		 * @param {Object} config the configuration for this panel
		 */
		constructor: function (config) {
			config = config || {};
			var type = config.ownerCt.records[0].get('type');
			this.recordId = config.ownerCt.records[0].get('folder_id');
			this.parentRecord = config.ownerCt.records[0];
			var shares = this.parentRecord.get('sharedid');
			Zarafa.plugins.files.backend.Default.data.singleton.ShareStore.init(type);
			this.setupGridStoreListeners();

			Ext.applyIf(config, {
				listeners: {
					afterrender: this.checkSharedRecord,
				},
				height: 450,
				width: 780,
				items: [
					{
						xtype: 'fieldset',
						title: _('Share with user/group'),
						autoHeight: true,
						ref: 'userfieldset',
						items: [
							{
								xtype: 'filesplugin.default.filesshareusergrid',
								ref: '../usergrid',
								height: 200,
								recordId: this.recordId,
							},
						],
					},
					{
						xtype: 'checkbox',
						fieldLabel: '',
						boxLabel: _('Share via link'),
						ref: 'linkcheckbox',
						inputValue: 'sharelink',
						style: {
							marginTop: '5px',
							marginLeft: '6px',
						},
						listeners: {
							check: this.onShareViaLinkChecked.createDelegate(this),
						},
					},
					{
						xtype: 'fieldset',
						title: _('Share via link'),
						autoHeight: true,
						ref: 'linkfieldset',
						hidden: true,
						items: [
							{
								layout: 'column',
								border: false,
								defaults: {
									border: false,
								},
								anchor: '0',
								items: [
									{
										columnWidth: 0.95,
										layout: 'form',
										items: {
											xtype: 'textfield',
											fieldLabel: _('Public link'),
											ref: '../../../linkfield',
											anchor: '100%',
											selectOnFocus: true,
											readOnly: true,
										},
									},
									{
										columnWidth: 0.05,
										items: {
											xtype: 'button',
											iconCls: 'icon_copy_clipboard',
											handler: this.onCopyUrl,
											scope: this,
										},
									},
								],
							},
							{
								xtype: 'checkbox',
								fieldLabel: _('Password protect'),
								boxLabel: '',
								ref: '../passwordcheckbox',
								inputValue: 'pwprotected',
								listeners: {
									check: this.onUsePasswordChecked.createDelegate(this),
								},
							},
							{
								xtype: 'textfield',
								fieldLabel: _('Password'),
								ref: '../passwordfield',
								hidden: true,
								inputType: 'password',
								name: 'textvalue',
								listeners: {
									change: this.onPasswordChange.createDelegate(this),
									keyup: this.onPasswordChange.createDelegate(this),
								},
							},
							{
								xtype: 'checkbox',
								fieldLabel: _('Public upload'),
								boxLabel: '',
								hidden: true,
								ref: '../editcheckbox',
								inputValue: 'allowediting',
								listeners: {
									check: this.onAllowEditingChecked.createDelegate(this),
								},
							},
							{
								xtype: 'checkbox',
								fieldLabel: _('Expiration date'),
								boxLabel: '',
								ref: '../expirationcheckbox',
								inputValue: 'useexpiration',
								listeners: {
									check: this.onUseExpirationDateChecked.createDelegate(this),
								},
							},
							{
								xtype: 'datefield',
								ref: '../expirationfield',
								hidden: true,
								fieldLabel: _('Date'),
								minValue: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // tomorrow
								width: 170,
								format: 'Y-m-d',
								listeners: {
									change: this.onExpirationDateChange.createDelegate(this),
									keyup: this.onExpirationDateChange.createDelegate(this),
								},
							},
						],
					},
					{
						xtype: 'label',
						text: _(
							'More than 1 share link exists. Only showing the latest one',
						),
						hidden: (shares || []).length < 2,
						width: '100%',
						autoWidth: true,
					},
				],
				buttons: [
					{
						xtype: 'button',
						text: _('Ok'),
						handler: this.onDoneButtonClick,
						ref: '../doneButton',
						scope: this,
					},
					{
						xtype: 'button',
						text: _('Cancel'),
						handler: this.onCancel,
						scope: this,
					},
				],
			});

			Zarafa.plugins.files.backend.Default.ui.FilesShareDialogPanel.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Create the onUpdate and onRemove listeners for the {@link Zarafa.plugins.files.backend.Default.data.ShareGridStore ShareGridStore}.
		 * @private
		 */
		setupGridStoreListeners: function () {
			var store =
				Zarafa.plugins.files.backend.Default.data.singleton.ShareStore.getStore();
			store.on('add', this.onGridStoreAdd, this);
			store.on('update', this.onGridStoreUpdate, this);
			store.on('remove', this.onGridStoreRemove, this);
		},

		/**
		 * Eventhandler for the remove event of the {@link Zarafa.plugins.files.backend.Default.data.ShareGridStore ShareGridStore}.
		 * If the shareid is set, it will remove the share from the backend.
		 *
		 * @param store the grid store holding share records
		 * @param record the share record to remove
		 * @private
		 */
		onGridStoreRemove: function (store, record) {
			// check if an id is set - if so, remove the old share
			if (record.get('id') != '' && record.get('id') != -1) {
				this.removeShareByID(record.get('id'));
			}
		},

		/**
		 * Eventhandler for the update event of the {@link Zarafa.plugins.files.backend.Default.data.ShareGridStore ShareGridStore}.
		 * This will first remove the new dirty record and then create a new one. So the save function of the store is not used :)
		 *
		 * @param store the grid store holding share records
		 * @param record the share record to update
		 * @private
		 */
		onGridStoreUpdate: function (store, record) {
			this.updateExistingShare(record);
		},

		/**
		 * Eventhandler for the add event of the {@link Zarafa.plugins.files.backend.Default.data.ShareGridStore ShareGridStore}.
		 * This will add a new entry to the gridstore.
		 *
		 * @param store the grid store holding share records
		 * @param records the share records to add
		 * @private
		 */
		onGridStoreAdd: function (store, records) {
			// Ignore the initial loading of the store
			if (records.length != 1 || records[0].get('id') != -1) {
				return true;
			}
			this.createShare(records[0], store, false);
		},

		/**
		 * Eventhandler for the checkbox change event.
		 *
		 * @param checkbox
		 * @param checked
		 * @private
		 */
		onShareViaLinkChecked: function (checkbox, checked) {
			if (checked) {
				this.linkfieldset.show();

				// create a new share
				this.createShareByLink();
			} else {
				this.linkfieldset.hide();
				this.removeShareByID(this.linkShareID);
				this.linkShareID = -1; // reset the id
			}
		},

		/**
		 * Eventhandler for the checkbox change event.
		 *
		 * @param checkbox
		 * @param checked
		 * @private
		 */
		onUsePasswordChecked: function (checkbox, checked) {
			if (checked) {
				this.passwordfield.show();
			} else {
				this.passwordfield.hide();
			}
		},

		/**
		 * Eventhandler for the textfield change event.
		 *
		 * @param field
		 * @param event
		 * @private
		 */
		onPasswordChange: function (field, event) {
			this.passwordChanged = true;
		},

		/**
		 * Eventhandler for the checkbox change event.
		 *
		 * @param checkbox
		 * @param checked
		 * @private
		 */
		onAllowEditingChecked: function (checkbox, checked) {
			this.pubUploadChanged = true;
		},

		/**
		 * Eventhandler for the checkbox change event.
		 *
		 * @param checkbox
		 * @param checked
		 * @private
		 */
		onUseExpirationDateChecked: function (checkbox, checked) {
			if (checked) {
				this.expirationfield.show();
			} else {
				this.expirationfield.hide();
			}
		},

		/**
		 * Eventhandler for the datefield change event.
		 *
		 * @private
		 */
		onExpirationDateChange: function () {
			this.expirationDateChanged = true;
		},

		/**
		 * Event handler which is triggered when the user presses the cancel
		 * {@link Ext.Button button}. This will close this dialog.
		 * @private
		 */
		onCancel: function () {
			this.dialog.close();
		},

		/**
		 * Close the dialog and clean all eventhandlers.
		 * @private
		 */
		closeDialog: function () {
			var store =
				Zarafa.plugins.files.backend.Default.data.singleton.ShareStore.getStore();

			store.un('update', this.onGridStoreUpdate, this);
			store.un('remove', this.onGridStoreRemove, this);

			this.dialog.close();
		},

		/**
		 * Close the loadmask
		 * @private
		 */
		closeLoadMask: function () {
			this.loadMask.hide();
		},

		/**
		 * Eventhandler for the "done" button.
		 * It will save all changes of the linkshare and close the dialog.
		 * @private
		 */
		onDoneButtonClick: function () {
			// check if we have a link or user/group share
			if (this.linkcheckbox.getValue()) {
				// we have a link share
				// check if we have to update the share
				this.updateExistingShare();
				Zarafa.plugins.files.data.Actions.updateCache(this.recordId);
			} else {
				// we have a user/group share
				this.closeDialog();
			}
		},

		/**
		 * Eventhandler for the "copy url" button.
		 * Copies the sharelink url to the users clipboarl. When IE is no
		 * longer supported switch to the navigator.clipboard API.
		 * @private
		 */
		onCopyUrl: function () {
			this.linkfield.el.dom.select();
			document.execCommand('copy');
		},

		/**
		 * This method checks the dialog records for existing shares. If shares were found, it will try to load the details.
		 * @private
		 */
		checkSharedRecord: function () {
			// init loading mask after the panel was rendered
			this.loadMask = new Ext.LoadMask(this.getEl(), {
				msg: _('Loading details…'),
			});

			// check if we have a shared record where we should load details
			if (Ext.isDefined(this.parentRecord)) {
				// enable the edit checkbox if we have a folder record
				if (
					this.parentRecord.get('type') ===
					Zarafa.plugins.files.data.FileTypes.FOLDER
				) {
					this.editcheckbox.show();
				}

				if (this.parentRecord.get('isshared') === true) {
					this.initSharedRecord();
				}
			}
		},

		/**
		 * This method requests the sharedetails from the backend.
		 * @private
		 */
		initSharedRecord: function () {
			this.loadMask.show();

			var recIds = [this.recordId];

			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'loadsharingdetails',
				{
					records: recIds,
				},
				new Zarafa.plugins.files.backend.Default.data.ResponseHandler({
					successCallback: this.initGuiFromSharedRecord.createDelegate(this),
				}),
			);
		},

		/**
		 * Callback for the loadsharingdetails response. This function will initialize the UI with the given
		 * share records.
		 *
		 * @param {Object} response the response object from the share record request
		 * @private
		 */
		initGuiFromSharedRecord: function (response) {
			var shares = response.shares[this.recordId];

			for (var shareid in shares) {
				var share = shares[shareid];
				if (
					share.shareType ===
					Zarafa.plugins.files.backend.Default.data.RecipientTypes.LINK
				) {
					// store the id of this share
					this.linkShareID = shareid;

					// change gui
					this.linkfieldset.show();
					this.linkcheckbox.suspendEvents(false); // Stop all events.
					this.linkcheckbox.setValue(true); // check checkbox
					this.linkcheckbox.resumeEvents(); // resume events
					this.linkfield.setValue(share.url);

					// check expiration
					if (!Ext.isEmpty(share.expiration)) {
						this.expirationcheckbox.setValue(true); // check checkbox
						var dt = new Date(share.expiration);
						this.expirationfield.setValue(dt);
					}
					// check password
					if (!Ext.isEmpty(share.shareWith)) {
						this.passwordcheckbox.setValue(true); // check checkbox
						this.passwordfield.setValue('******');
					}
					//check permissions
					if (!Ext.isEmpty(share.permissions)) {
						if (parseInt(share.permissions) === 7) {
							this.editcheckbox.suspendEvents(false); // Stop all events.
							this.editcheckbox.setValue(true); // check checkbox
							this.editcheckbox.resumeEvents(); // resume events
						}
					}
				} else if (
					share.shareType ===
					Zarafa.plugins.files.backend.Default.data.RecipientTypes.GROUP
				) {
					Zarafa.plugins.files.backend.Default.data.singleton.ShareStore.addGroup(
						share,
					);
				} else {
					Zarafa.plugins.files.backend.Default.data.singleton.ShareStore.addUser(
						share,
					);
				}

				this.doneButton.setDisabled(false);
			}

			this.loadMask.hide();
		},

		/**
		 * This method will request the creation of a new linkshare from the backend.
		 * @private
		 */
		createShareByLink: function () {
			this.loadMask.show();

			var recIds = [this.recordId];

			var shareOpts = {
				shareType:
					Zarafa.plugins.files.backend.Default.data.RecipientTypes.LINK,
			};

			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'createnewshare',
				{
					records: recIds,
					options: shareOpts,
				},
				new Zarafa.plugins.files.backend.Default.data.ResponseHandler({
					successCallback: this.shareByLinkCreated.createDelegate(this),
					failureCallback: this.closeDialog.createDelegate(this),
				}),
			);
		},

		/**
		 * Callback for the createnewshare response. It will update the parent record and the UI.
		 *
		 * @param {Object} response the share link creation response
		 * @private
		 */
		shareByLinkCreated: function (response) {
			var share = response.shares[this.recordId.replace(/\/+$/g, '')];
			this.linkfield.setValue(share['url']);

			// store the id of this share
			this.linkShareID = share['id'];

			var recIds = this.parentRecord.get('sharedid') || [];
			recIds.push(share['id']);

			// also update the parent record
			this.parentRecord.set('sharedid', recIds);
			this.parentRecord.set('isshared', true);

			// enable the done button
			this.doneButton.setDisabled(false);

			// Reload file in view to show "attack as link" button
			Zarafa.plugins.files.data.Actions.updateCache(this.recordId);

			this.loadMask.hide();
		},

		/**
		 * This method will request the deletion of a one share from the backend.
		 * @private
		 */
		removeShareByID: function (id) {
			this.loadMask.show();
			var accId = this.parentRecord.getAccount().get('id');

			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'deleteexistingshare',
				{
					records: [id],
					accountid: accId,
				},
				new Zarafa.plugins.files.backend.Default.data.ResponseHandler({
					successCallback: this.shareByIDRemoved.createDelegate(
						this,
						[id],
						true,
					),
					failureCallback: this.closeDialog.createDelegate(this),
				}),
			);
		},

		/**
		 * Callback for the deleteexistingshare response. It will update the parent record and the UI.
		 *
		 * @param {Object} response
		 * @param {Number} id
		 * @private
		 */
		shareByIDRemoved: function (response, id) {
			var recIds = this.parentRecord.get('sharedid') || [];

			// For some reason 'id' is a string when the record was shared before opening the dialog
			var index = recIds.indexOf(parseInt(id));

			if (index > -1) {
				recIds.splice(index, 1); // remove the id from the array
			}

			// also update the parent record
			this.parentRecord.set('sharedid', recIds);

			if (recIds.length == 0) {
				this.parentRecord.set('isshared', false);
			}

			// Reload file in view to show "attack as link" button
			Zarafa.plugins.files.data.Actions.updateCache(this.recordId);

			this.loadMask.hide();
		},

		/**
		 * This method will request the creation or update of a user or group share from the backend.
		 *
		 * @param record holding data for the share to be create
		 * @param store the gridstore
		 * @private
		 */
		createShare: function (record, store) {
			this.loadMask.show();
			var recIds = [this.recordId]; // we're only going to share one file
			var permissions = this.getPermissions(record);
			var shareOpts = {
				shareType:
					record.get('type') === 'user'
						? Zarafa.plugins.files.backend.Default.data.RecipientTypes.USER
						: Zarafa.plugins.files.backend.Default.data.RecipientTypes.GROUP,
				shareWith: record.get('shareWith'),
				permissions: permissions,
				shareWithDisplayname: record.get('shareWithDisplayname'),
			};

			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'createnewshare',
				{
					records: recIds,
					options: shareOpts,
				},
				new Zarafa.plugins.files.backend.Default.data.ResponseHandler({
					successCallback: this.shareCreated.createDelegate(
						this,
						[shareOpts, record],
						true,
					),
					failureCallback: this.shareFailed.createDelegate(this, [
						store,
						record,
					]),
				}),
			);
		},

		/**
		 * successCallback for the createnewshare response. It will update the parent record and the UI.
		 *
		 * @param {Object} response the response object from the createnewshare request
		 * @param {Object} shareOpts object with sharing options
		 * @param {Ext.data.Record} record share options record.
		 * @private
		 */
		shareCreated: function (response, shareOpts, record) {
			var share = response.shares[this.recordId.replace(/\/+$/g, '')];
			var recIds = this.parentRecord.get('sharedid') || [];
			recIds.push(share['id']);
			record.data.id = share['id'];

			// update the parent record
			this.parentRecord.set('sharedid', recIds);
			this.parentRecord.set('isshared', true);
			shareOpts.id = share.id;

			this.loadMask.hide();
		},

		/**
		 * failureCallback for the createnewshare response. It will remove the record that has been tried to add.
		 * @param store the grid store
		 * @param record record that should be created
		 * @private
		 */
		shareFailed: function (store, record) {
			store.remove(record);
			this.loadMask.hide();
		},

		/**
		 * This method will request the modification of the lin share options from the backend.
		 *
		 * @param {Ext.data.Record} record share options record.
		 */
		updateExistingShare: function (record) {
			this.loadMask.show();
			var shareOpts = {};
			var records = [];
			if (Ext.isDefined(record)) {
				shareOpts['permissions'] = this.getPermissions(record);
				records.push(record.get('id'));
			} else {
				if (this.passwordChanged) {
					shareOpts['password'] = this.passwordfield.getValue();
				}
				if (!this.passwordcheckbox.getValue()) {
					shareOpts['password'] = '';
				}
				if (this.pubUploadChanged) {
					// don't use publicUpload as this flag does not work (yet?) - ocs bug

					if (this.editcheckbox.getValue()) {
						shareOpts['permissions'] = 7;
					} else {
						shareOpts['permissions'] = 1;
					}
				}
				if (this.expirationDateChanged) {
					shareOpts['expireDate'] = this.expirationfield.getRawValue();
				}
				if (!this.expirationcheckbox.getValue()) {
					shareOpts['expireDate'] = '';
				}
				records.push(this.linkShareID);
			}

			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'updateexistingshare',
				{
					records: records,
					accountid: this.parentRecord.getAccount().get('id'),
					options: shareOpts,
				},
				new Zarafa.plugins.files.backend.Default.data.ResponseHandler({
					successCallback: this.shareByLinkUpdated.createDelegate(this, [
						record,
					]),
					failureCallback: this.closeLoadMask.createDelegate(this),
				}),
			);
		},

		/**
		 * Callback for the updateexistingshare response. This function simply closes the dialog.
		 *
		 * @param {Ext.data.Record} record share options record.
		 * @private
		 */
		shareByLinkUpdated: function (record) {
			this.loadMask.hide();
			if (!Ext.isDefined(record)) {
				this.closeDialog();
			}
		},

		/**
		 * Helper function to get permission from record.
		 *
		 * @param {Ext.data.Record} record share options record.
		 * @returns {number} permissions return calculated permissions.
		 */
		getPermissions: function (record) {
			var permissions = 1;
			if (record.get('permissionChange')) {
				permissions += 2;
			}
			if (record.get('permissionCreate')) {
				permissions += 4;
			}
			if (record.get('permissionDelete')) {
				permissions += 8;
			}
			if (record.get('permissionShare')) {
				permissions += 16;
			}

			return permissions;
		},
	},
);

Ext.reg(
	'filesplugin.default.filessharedialogpanel',
	Zarafa.plugins.files.backend.Default.ui.FilesShareDialogPanel,
);
