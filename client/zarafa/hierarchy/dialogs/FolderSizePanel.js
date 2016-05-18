Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.FolderSizePanel
 * @extends Ext.Panel
 * @xtype zarafa.foldersizepanel
 *
 * This will display a {@link Zarafa.core.ui.ContentPanel contentpanel}
 * for displaying the size of the {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} and the subfolders.
 */
Zarafa.hierarchy.dialogs.FolderSizePanel = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype : 'zarafa.foldersizepanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border : false,
			items: [
				this.createFolderSizePanel(),
				this.createSubfolderSizePanel()
			]
		});

		Zarafa.hierarchy.dialogs.FolderSizePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create the {@link Ext.form.FormPanel form} which contains the size information
	 * for the currently selected folder.
	 * @return {Object} configuration object for the form
	 * @private
	 */
	createFolderSizePanel : function()
	{
		return {
			xtype : 'form',
			ref : 'folderPanel',
			autoHeight : true,
			border : false,
			labelWidth: 200,
			items : [{
				xtype : 'zarafa.displayfield',
				fieldLabel : _('Folder Name'),
				htmlEncode : true,
				name : 'display_name'
			},{
				xtype : 'zarafa.displayfield',
				fieldLabel : _('Size (without subfolders)'),
				renderer : Ext.util.Format.fileSize,
				name : 'message_size'
			},{
				xtype : 'zarafa.displayfield',
				fieldLabel : _('Total size (including subfolders)'),
				renderer : Ext.util.Format.fileSize,
				name : 'total_message_size'
			}]
		};
	},

	/**
	 * Create the {@link Ext.grid.GridPanel grid} which contains the overview
	 * of all subfolders for the current folder combined with their respective
	 * sizes and total sizes.
	 */
	createSubfolderSizePanel : function()
	{
		return {
				xtype : 'grid',
				ref : 'subfolderView',
				flex : 1,
				store : new Zarafa.hierarchy.data.IPFSubStore(),
				enableColumnHide : false,
				border: true,
				loadMask : {
					msg : _('Loading subfolder sizes') + '...'
				},
				viewConfig : {
					forceFit : true,
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No subfolders present') + '</div>'
				},
				sm : new Ext.grid.RowSelectionModel({ singleSelect : true }),
				columns : [{
					header : _('Subfolder'),
					sortable : true,
					dataIndex : 'folder_pathname',
					renderer : Ext.util.Format.htmlEncode,
					tooltip : _('Sort by: Name of the subfolder')
				},{
					header : _('Size'),
					sortable : true,
					dataIndex : 'message_size',
					renderer : Ext.util.Format.fileSize,
					width: 50,
					tooltip : _('Sort by: Size (without subfolders)')
				},{
					header : _('Total size'),
					sortable : true,
					dataIndex : 'total_message_size',
					renderer : Ext.util.Format.fileSize,
					width: 50,
					tooltip : _('Sort by: Total size (including subfolders)')
				}]
		};
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if (contentReset) {
			if (this.record !== record) {
				this.record = record;

				this.subfolderView.loadMask.show();

				var store = record.getStore();

				// Open the record to request for the foldersize information
				this.mon(store, 'open', this.onOpenFolderSize, this);
				record.open({ actionType : 'foldersize', forceLoad : true });
			}
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.core.data.MAPIStore store}
	 * fires the {@link Zarafa.core.data.MAPIStore#open} event. This will load all
	 * new information into the form and grid.
	 * @param {Ext.data.Store} store The store which fired the event
	 * @param {Ext.data.Record} record The record which was opened
	 * @private
	 */
	onOpenFolderSize : function(store, record)
	{
		// Check if this is the record which we need
		if (this.record !== record) {
			return;
		}

		// Load all information into the panel
		this.folderPanel.getForm().loadRecord(record);

		var substore = record.getSubStore('folders');
		var columns = this.subfolderView.getColumnModel();

		// Load the subfolders into the grid
		this.subfolderView.reconfigure(substore, columns);

		// By default we will sort on the folder path
		substore.sort(columns.getDataIndex(0), 'ASC');

		// Remove event handler
		this.mun(store, 'open', this.onOpenFolderSize, this);
		this.subfolderView.loadMask.hide();
	}
});

Ext.reg('zarafa.foldersizepanel', Zarafa.hierarchy.dialogs.FolderSizePanel);
