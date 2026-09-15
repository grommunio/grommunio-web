/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui.dialogs');

/**
 * @class Grommunio.plugins.files.ui.dialogs.CreateFolderPanel
 * @extends Ext.Panel
 * @xtype filesplugin.createfolderpanel
 *
 * Panel for users to create folder record in different supported backends.
 */
Grommunio.plugins.files.ui.dialogs.CreateFolderPanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg {Grommunio.plugins.files.data.FilesFolderRecord} parentFolder (optional) The parent folder
	 * underneath the new folder will be created.
	 */
	parentFolder : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype : 'filesplugin.createfolderpanel',
			layout: {
				type: 'fit',
				align: 'stretch'
			},
			border: false,
			header: false,
			items: this.createPanel(config),
			buttonAlign: 'right',
			buttons: [{
				text: _('Ok'),
				ref: '../okButton',
				cls: 'grommunio-action',
				handler : this.onOk,
				scope: this
			},{
				text: _('Cancel'),
				ref: '../cancelButton',
				handler : this.onCancel,
				scope: this
			}]
		});

		Grommunio.plugins.files.ui.dialogs.CreateFolderPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates body for {@link Grommunio.plugins.files.ui.dialogs.CreateFolderContentPanel CreateFolderContentPanel}
	 * @param {Object} config The config options contains the {@link Grommunio.plugins.files.FilesContextModel FilesContextModel} and
	 * {@link Grommunio.plugins.files.ui.Tree#accountFilter}. which used by {@link Grommunio.plugins.files.ui.Tree Tree}.
	 *
	 * @return {Array} Array which contains configuration object to create the {@link Grommunio.plugins.files.ui.Tree TreePanel}.
	 * @private
	 */
	createPanel : function(config)
	{
		return [{
			xtype : 'panel',
			layout : 'form',
			border : false,
			defaults : {
				anchor :'100%'
			},
			labelAlign : 'top',
			items : [{
				xtype : 'textfield',
				fieldLabel : _('Name'),
				cls: 'form-field-name',
				ref : '../newNameField',
				enableKeyEvents: true,
				listeners: {
					keyup: {
						fn: this.handleEnter,
						buffer: 200
					},
					scope: this
				}
			},{
				xtype : 'filesplugin.tree',
				model : config.model,
				FilesFilter: Grommunio.plugins.files.data.FileTypes.FOLDER,
				bodyCssClass : 'files-create-folder-tree-panel',
				fieldLabel : _('Select where to place the folder'),
				anchor : '100% 80%',
				forceLayout : true,
				ref : '../hierarchyTree',
				accountFilter : config.accountFilter
			}]
		}];
	},

	/**
	 * Function called by Extjs when the panel has been {@link #render rendered}.
	 * At this time all events can be registered.
	 * @private
	 */
	initEvents : function ()
	{
		Grommunio.plugins.files.ui.dialogs.CreateFolderPanel.superclass.initEvents.apply(this, arguments);
		// If there is a folder we should select, the enable the 'load' event handler
		// as we will have to wait until the correct node has been loaded.
		if (this.parentFolder) {
			this.mon(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
		this.mon(this.hierarchyTree.getSelectionModel(), 'selectionchange', this.onHierarchyNodeSelect, this);
	},

	/**
	 * Event handler which is triggered when the user presses the cancel
	 * {@link Ext.Button button}. This will close this dialog.
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	},

	/**
	 * Event handler which is triggered when the user presses the ok
	 * {@link Ext.Button button}. function is responsible to create folder
	 * under the respective folder as well as check for duplicate folder.
	 *
	 * @param {Ext.Button} button which triggers this event.
	 * @param {Ext.EventObject} event The event object
	 */
	onOk : function (button, event)
	{
		var folderName = this.newNameField.getValue();

		if (Ext.isEmpty(folderName.trim())) {
			container.getNotifier().notify('warning.files', _('Files'), _('You must specify a name.'));
			return;
		}

		var childFolders = this.parentFolder.getChildren();
		var folderAlreadyExist = childFolders.some(function(item){
			return item.get('filename') === folderName;
		});

		if (folderAlreadyExist) {
			Grommunio.plugins.files.data.Actions.msgWarning(_('Folder already exists'));
			return;
		} else if (!Grommunio.plugins.files.data.Utils.File.isValidFilename(folderName)) {
			Grommunio.plugins.files.data.Actions.msgWarning(_('Incorrect foldername'));
			return;
		}

		var record = this.record;
		record.beginEdit();
		record.set("display_name", folderName);
		record.set("filename", folderName);
		record.set("text", folderName);
		record.set("icon_index", Grommunio.core.mapi.IconIndex["folder_note"]);
		record.set("folder_id", this.parentFolder.get('folder_id') + folderName + "/" );
		record.set("path", this.parentFolder.get('folder_id'));
		record.set("parent_entryid", this.parentFolder.get('entryid'));
		record.set("store_entryid", this.parentFolder.get('store_entryid'));
		record.endEdit();

		this.dialog.saveRecord();
	},

	/**
	 * Event handler which triggered when selection get change in hiererachy tree.
	 *
	 * @param {model} model The model for the treepanel
	 * @param {TreeNode} node The selected tree node
	 * @private
	 */
	onHierarchyNodeSelect : function(model, node)
	{
		if (node) {
			this.parentFolder = node.getFolder();
		}
	},

	/**
	 * Fired when the {@link Grommunio.hierarchy.ui.Tree Tree} fires the {@link Grommunio.hierarchy.ui.Tree#load load}
	 * event. This function will try to select the {@link Ext.tree.TreeNode TreeNode} in
	 * {@link Grommunio.hierarchy.ui.Tree Tree} initially. When the given node is not loaded yet, it will try again
	 * later when the event is fired again.
	 *
	 * @private
	 */
	onTreeNodeLoad : function()
	{
		// If the folder could be selected, then unregister the event handler.
		if (this.hierarchyTree.selectFolderInTree(this.parentFolder)) {
			this.mun(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
			// Force focus on input field
			this.newNameField.focus();
		}
	},

	/**
	 * Function is used to update values of fields when ever an updated
	 * {@link Grommunio.plugins.files.data.FilesFolderRecord record} is received.
	 * @param {Grommunio.plugins.files.data.FilesFolderRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
	},

	/**
	 * Event handler which is triggered when
	 * a key is pressed in the searchTextField
	 *
	 * @param {Ext.form.TextField} field
	 * @param {Ext.EventObject} e
	 * @private
	 */
	handleEnter: function(field, e)
	{
		if (e.getKey() === e.ENTER) {
			this.onOk();
		}
	}
});

Ext.reg('filesplugin.createfolderpanel', Grommunio.plugins.files.ui.dialogs.CreateFolderPanel);
