Ext.namespace('Zarafa.plugins.files.ui.dialogs');

/**
 * @class Zarafa.plugins.files.ui.dialogs.SaveToFilesPanel
 * @extends Ext.Panel
 * @xtype filesplugin.savetofilespanel
 *
 * This dialog panel will provide the file chooser tree for the destination folder selection.
 */
Zarafa.plugins.files.ui.dialogs.SaveToFilesPanel = Ext.extend(Ext.Panel, {

	/**
	 * @var {Object} response holds the response data from the attachment preparation event
	 */
	response: null,

	/**
	 * @constructor
	 * @param config
	 */
	constructor: function (config) {
		config = config || {};
		this.response = config.response;

		config = Ext.applyIf(config, {
			xtype : 'filesplugin.savetofilespanel',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			border: false,
			header: false,
			items : [
				this.createTreePanel(config),
				this.createGridPanel()
			],
			buttonAlign: 'right',
			buttons: this.createActionButtons()
		});

		Zarafa.plugins.files.ui.dialogs.SaveToFilesPanel.superclass.constructor.call(this, config);

		if (Ext.isDefined(this.model)) {
			this.mon(this.hierarchyTree, 'click', this.onTreeNodeClick, this);
		}
	},

	/**
	 * Create the {@link Zarafa.plugins.files.ui.Tree Tree}.
	 * @param {Object} config The configuration object.
	 * @return {Object} return an object which used to create the {@link Zarafa.plugins.files.ui.Tree Tree}
	 */
	createTreePanel : function(config)
	{
		return {
			xtype : 'filesplugin.tree',
			model : config.model,
			border : true,
			flex : 1,
			ref : 'hierarchyTree'
		};
	},

	/**
	 * Create the {@link Ext.grid.GridPanel GridPanel} which contains the files item
	 * of selected folder.
	 * @return {Object} return an object which used to create the {@link Ext.grid.GridPanel GridPanel}
	 */
	createGridPanel : function()
	{
		return {
			xtype: 'grid',
			style: {
				paddingLeft: '9px'
			},
			ref : 'filesGrid',
			flex : 2,
			columns: [{
				dataIndex: 'type',
				header   : '<p class="icon_index">&nbsp;</p>',
				headerCls: 'zarafa-icon-column icon',
				renderer : Zarafa.plugins.files.data.Utils.Renderer.typeRenderer,
				width    : 24,
				fixed    : true,
				tooltip  : dgettext('plugin_files', 'Sort by: Type')
			},{
				header   : dgettext('plugin_files', 'Filename'),
				dataIndex: 'filename',
				width    : 160,
				tooltip  : dgettext('plugin_files', 'Sort by: Filename')
			},{
				header   : dgettext('plugin_files', 'Size'),
				dataIndex: 'message_size',
				width    : 80,
				renderer : Zarafa.plugins.files.data.Utils.Format.fileSizeList,
				tooltip  : dgettext('plugin_files', 'Sort by: Size')
			}],
			loadMask : {
				msg : _('Loading files') + '...'
			},
			store:{
				xtype: 'filesplugin.filesrecordstore',
			},
			viewConfig : {
				deferEmptyText : true,
				emptyText : '<div class="emptytext">' + _('There are no items to show in this list') + '</div>',
				forceFit : true
			}
		}
	},

	/**
	 * Generate the toolbar action buttons.
	 *
	 * @returns {Array} return an array of buttons.
	 */
	createActionButtons: function () {
		return [{
			xtype: 'button',
			text: dgettext('plugin_files', 'New folder'),
			cls: 'zarafa-normal',
			handler: this.onClickNewFolder,
			scope: this
		}, {
			xtype: 'button',
			text: dgettext('plugin_files', 'Save'),
			cls: 'zarafa-action',
			iconCls: 'icon_files_category_white',
			handler: this.onClickSave,
			scope: this
		}];
	},

	/**
	 * Called when a treeNode is click in tree. The corresponding folder is added to,
	 * or removed from the active folder list depending on the state of the check box.
	 * @param {Ext.tree.TreeNode} treeNode tree node.
	 * @private
	 */
	onTreeNodeClick : function(treeNode)
	{
		var folder = treeNode.getFolder();
		this.filesGrid.store.load({
			params: {
				only_files : true
			},
			folder : folder });
	},

	/**
	 * This will check if the file already exists in store.
	 */
	onClickSave: function ()
	{
		var folder = this.getSelectedFolder();

		if (!Ext.isDefined(folder)) {
			return false;
		}

		var store = this.filesGrid.getStore();

		var filesExists = [];

		for (var i = 0, len = this.response.count; i < len; i++) {
			var fileName = this.response.items[i].filename;
			var fileExists = store.find('display_name', fileName);

			if (fileExists !== -1) {
				filesExists.push(fileName);
			}
		}

		if (!Ext.isEmpty(filesExists)) {
			// TODO: Show which file name is duplicated.
			Ext.MessageBox.confirm(
				dgettext('plugin_files', 'Confirm overwrite'),
				dgettext('plugin_files', 'File already exists. Do you want to overwrite it?'),
				function(button) {
					if (button === 'no') {
						return;
					}
					this.doUpload(folder, button);
				},
				this
			);
		} else {
			this.doUpload(folder);
		}
	},

	/**
	 * This function will prompt {@link Zarafa.plugins.files.ui.dialogs.CreateFolderContentPanel CreateFolderContentPanel}
	 * the user for a new folder name.
	 */
	onClickNewFolder: function () {
		var folder = this.getSelectedFolder();
		if (!Ext.isDefined(folder)) {
			return;
		}
		Zarafa.plugins.files.data.Actions.createFolder(this.model, undefined, folder);
	},

	/**
	 * Function used to get the selected folder.
	 *
	 * @return {Zarafa.plugins.files.data.FilesFolderRecord|undefined} return selected folder else undefined.
	 */
	getSelectedFolder : function()
	{
		var selectionModel = this.hierarchyTree.getSelectionModel();
		var selectedNode = selectionModel.getSelectedNode();
		if (Ext.isEmpty(selectedNode)) {
			Zarafa.plugins.files.data.Actions.msgWarning(dgettext('plugin_files', 'You have to choose a folder!'));
			return undefined;
		}
		return selectedNode.getFolder();
	},

	/**
	 * This function uploads the file to the server.
	 *
	 * @param button
	 */
	doUpload: function (folder, button)
	{
		if (!Ext.isDefined(button) || button === "yes") {
			try {
				this.disable();
				container.getRequest().singleRequest(
					'filesbrowsermodule',
					'uploadtobackend',
					{
						items  : this.response.items,
						count  : this.response.count,
						type   : this.response.type,
						destdir: folder.get('folder_id')
					},
					new Zarafa.core.data.AbstractResponseHandler({
						doUploadtobackend: this.uploadDone.createDelegate(this)
					})
				);
			} catch (e) {
				Zarafa.plugins.files.data.Actions.msgWarning(e.message);
			}
		}
	},

	/**
	 * Called after the upload has completed.
	 * It will notify the user and close the upload dialog.
	 *
	 * @param response
	 */
	uploadDone: function (response)
	{
		if (response.status === true) {
			container.getNotifier().notify('info.files', dgettext('plugin_files', 'Uploaded'), dgettext('plugin_files', 'Attachment successfully stored in Files'));
		} else {
			container.getNotifier().notify('error', dgettext('plugin_files', 'Upload Failed'), dgettext('plugin_files', 'Attachment could not be stored in Files! Error: ' + response.status));
		}

		this.dialog.close();
	}
});

Ext.reg('filesplugin.savetofilespanel', Zarafa.plugins.files.ui.dialogs.SaveToFilesPanel);
