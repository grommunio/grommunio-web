Ext.namespace('Zarafa.plugins.files.ui');

Zarafa.plugins.files.ui.FilesRecordAccountView = Ext.extend(Ext.Panel, {

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

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		if (!Ext.isDefined(config.store) && Ext.isDefined(config.model)) {
			config.store = config.model.getStore();
		}

		Ext.applyIf(config, {
			xtype: 'filesplugin.filesrecordaccountview',
			layout:'fit',
			cls : 'zarafa-files-accountview',
			loadMask : true,
			header : false,
			border : false,
			maskDisabled : false,
			height : 400,
			loadingText   : dgettext('plugin_files', 'Loading accounts') + '...',
			items :[{
				xtype: 'dataview',
				ref:'accountView',
				store : config.store,
				emptyText : '<div class="emptytext">' + dgettext('plugin_files', 'There are no accounts added. Go to settings, Files tab and add an account') + '</div>',
				autoScroll : true,
				singleSelect : true,
				deferEmptyText: false,
				overClass : 'zarafa-files-accountview-over',
				tpl : this.initTemplate(config.model),
				selectedClass : 'zarafa-files-accountview-selected',
				itemSelector : 'div.zarafa-files-accountview-container'
			}]
		});

		Zarafa.plugins.files.ui.FilesRecordAccountView.superclass.constructor.call(this, config);
	},

	initTemplate: function (model) {
		// Load the account store
		return new Ext.XTemplate(
			'<div style="height: 100%; width: 100%; overflow: auto;">',
				'<tpl for=".">',
					'<div class="zarafa-files-accountview-container">',
						'<div class="zarafa-files-account-background {.:this.getAccountType}"> </div>',
						'<div class="zarafa-files-account-info">',
							'<span class="zarafa-files-accountview-subject">{filename:htmlEncode}</span>',
							'<span class="zarafa-files-accountview-account">{.:this.getAccountIdentifier}</span>',
						'</div>',
					'</div>',
				'</tpl>',
			'</div>',
			{
				getAccountType: function (record) {
					// get an instance of the account store.
					var store = this.model.getHierarchyStore();

					// look up the account
					var account = store.getById(record.id);

					var backend = "Webdav"; // Default is webdav...
					if (Ext.isDefined(account)) {
						backend = account.get("backend");
					}

					return "icon_256_" + backend;
				},

				getAccountIdentifier: function (record) {
					// get an instance of the account store.
					var store = this.model.getHierarchyStore();

					// look up the account
					var account = store.getById(record.id);

					var identifier = ""; // Default is empty...
					// TODO: this is not dynamic because the backend_config variable names might change in other backends
					if (Ext.isDefined(account)) {
						var bconfig = account.get("backend_config");
						if(bconfig && Ext.isDefined(bconfig.user) && Ext.isDefined(bconfig.server_address)) {
							identifier = bconfig.user + "@" + bconfig.server_address;
						}
					}

					return Zarafa.plugins.files.data.Utils.Format.truncate(identifier, 27); // 27 = length of the account field
				},
				model : model
			}
		);
	},

	/**
	 * Called during rendering of the panel, this will initialize all events.
	 * @private
	 */
	initEvents: function ()
	{
		this.accountView.on({
			'dblclick'       : this.onIconDblClick,
			scope            : this
		});
	},

	/**
	 * Initialize the component.
	 * It will register afterrender event with given handler which create loading mask.
	 * @private
	 */
	initComponent: function ()
	{
		Zarafa.plugins.files.ui.FilesRecordAccountView.superclass.initComponent.apply(this, arguments);

		// create load mask
		if (this.loadMask) {
			this.on('afterrender', this.createLoadMask, this);
		}
	},

	/**
	 * Function will create {@link Zarafa.common.ui.LoadMask} which will be shown
	 * when loading the {@link Zarafa.plugins.files.ui.FilesRecordAccountView FilesRecordAccountView}.
	 * @private
	 */
	createLoadMask: function ()
	{
		var hierarchyStore = this.model.getHierarchyStore();
		if (hierarchyStore.isLoading()) {
			this.loadMask = new Zarafa.common.ui.LoadMask(this.getEl(), { msg: this.loadingText, store: this.store});
			this.loadMask.show();
		}
	},

	/**
	 * Destroy all elements which were created by this panel.
	 * @override
	 */
	destroy: function ()
	{
		Ext.destroy(this.loadMask);
		Zarafa.plugins.files.ui.FilesRecordAccountView.superclass.destroy.apply(this, arguments);
	},

	/**
	 * Event handler which triggered when double click on data view item.
	 *
	 * @param {Ext.DataView} dataView The dataView item which is double clicked.
	 * @param {Number} index The index of an item which double clicked.
	 */
	onIconDblClick: function (dataView, index)
	{
		 var store = this.accountView.getStore();
		 var record = store.getAt(index);
		 var folder = this.model.getHierarchyStore().getFolder(record.get('entryid'));
		container.selectFolder(folder);
	}
});

Ext.reg('filesplugin.filesrecordaccountview', Zarafa.plugins.files.ui.FilesRecordAccountView);

