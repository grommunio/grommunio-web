Ext.namespace('Zarafa.common.dialogs');

/**
 * @class Zarafa.common.dialogs.CopyMovePanel
 * @extends Ext.Panel
 * @xtype zarafa.copymovepanel
 *
 * Panel for users to copy or move the given {@link Zarafa.core.data.IPMRecord[] records}
 * to a differnt {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}.
 */
Zarafa.common.dialogs.CopyMovePanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record The record(s) which are being
	 * copied or moved through this panel
	 */
	record : undefined,
	/**
	 * @cfg {Zarafa.core.mapi.ObjectType} objectType The Objecttype of the
	 * {@link #record} which have been set on this panel. This is needed
	 * to determine if we are copy/moving folders or messages.
	 */
	objectType : undefined,

	/**
	 * {Zarafa.mail.MailStore} store or {Zarafa.hierarchy.data.IPFSubStore} store
	 * depending on the objectType.
	 * This store is cached in the panel, because the store of a record is removed
	 * when a user receives new email.
	 */
	store : undefined,

	/**
	 * A boolean that will be used to know if this dialog is focused for the first
	 * time.
	 * @type Boolean
	 * @property
	 * @private
	 */
	firstFocus : true,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (config.record) {
			if (!Array.isArray(config.record)) {
				config.record = [ config.record ];
				this.store = config.record.getStore();
			} else {
				this.store = config.record[0].getStore();
			}

			if (!config.objectType) {
				config.objectType = config.record[0].get('object_type');
			}
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.copymovepanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			header: true,
			items: [
				this.createTreePanel(config)
			],
			buttonAlign: 'left',
			buttons: [{
				text: _('Move'),
				handler: this.onMove,
				scope: this,
				ref: '../moveButton',
				disabled: true
			},{
				text: _('Copy'),
				handler: this.onCopy,
				scope: this,
				ref: '../copyButton',
				disabled: true
			},{
				text: _('New folder'),
				handler: this.onCreateFolder,
				scope: this,
				ref: '../createFolderButton',
				disabled: true
			},
			'->',
			{
				text: _('Cancel'),
				handler: this.onCancel,
				cls: 'zarafa-normal',
				scope: this
			}],
			listeners : {
				render: function() {
					// Add a listener for the focus event of the dialog window
					// to move the focus back to the selected node of the tree.
					var win = this.findParentByType('window');
					if (win && win.focusEl) {
						win.focusEl.on('focus', this.onDialogFocussed, this);
					}

					// Add the keymap
					Zarafa.core.KeyMapMgr.activate(this, 'Zarafa.common.dialogs.CopyMovePanel');
				}
			}
		});

		Zarafa.common.dialogs.CopyMovePanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the focus event of the dialog window. Will put the focus
	 * on the selected folder.
	 */
	onDialogFocussed : function(){
		var folder = this.dialog.getSelectedFolder();
		var treeNode;
		var visible = true;
		if (folder) {
			if ( this.firstFocus ) {
				// On first focus we will make sure that the selected folder
				// is visible.
				treeNode = this.hierarchyTree.ensureFolderVisible(folder);
			} else {
				treeNode = this.hierarchyTree.getTreeNode(folder);
				// Check if the node is visible by traversing its parents
				// If a parent is not expanded the node is not visible.
				var parent = treeNode.parentNode;
				while ( parent ) {
					if ( !parent.isExpanded() ) {
						visible = false;
						break;
					}
					parent = parent.parentNode;
				}
			}

			if ( treeNode && visible ) {
				// Remember the scroll position, because we don't want to change that
				var scrollTop = this.hierarchyTree.body.dom.scrollTop;

				// Move the focus to the selected folder by simply selecting it again
				treeNode.select();

				if ( !this.firstFocus ) {
					// Set the scroll position back
					this.hierarchyTree.body.dom.scrollTop = scrollTop;
				}
			}
		}

		this.firstFocus = false;
},

	/**
	 * Creates a {@link Zarafa.hierarchy.ui.Tree treepanel}
	 * which contains all the {@link Zarafa.hierarchy.data.MAPIFolderRecord folders}
	 * to which the {@link Zarafa.core.data.IPMRecord records} can be
	 * copied or moved to.
	 * @param {Object} config Configuration structure
	 * @return {Object} Configuration object for the tree panel.
	 * @private
	 */
	createTreePanel : function(config)
	{
		var record = Ext.isDefined(config.record) ? config.record[0] : undefined;
		var permission = config.permissionFilter ? config.permissionFilter : undefined;
		return {
			xtype: 'panel',
			layout: 'vbox',
			border: false,
			flex: 1,
			layoutConfig: {
				align: 'stretch'
			},
			cls: 'copymove-tree-panel',
			bodyStyle: 'background-color: inherit;',
			items: [{
				xtype: 'container',
				ref: 'displayfieldContainer',
				items: [{
					xtype: 'displayfield',
					value: _('Destination folder') + ':',
					hideLabel : true,
					cls: 'tree-header',
					ref: '../displayfield'
				}],
				autoheight: true
			},{
				xtype: 'zarafa.hierarchytree',
				flex: 1,
				border: true,
				treeSorter: true,
				hideTodoList: true,
				hideSearchFolders: true,
				enableDD : false,
				permissionFilter: permission,
				IPMFilter : this.getIPMFilter(record),
				anchor: '100% 90%',
				ref: '../hierarchyTree'
			}],
			listeners : {
				// autoheight does not work well for the vbox, so we set the height of the container manually
				// This way we can use css to determine the height
				'afterlayout': function(){
					this.displayfieldContainer.setHeight(this.displayfield.getHeight());
				}
			}
		};
	},

	/**
	 * Allows any sub class to provide IPMFilter value if requires.
	 */
	getIPMFilter : Ext.emptyFn,

	/**
	 * Function which is called automatically by ExtJs when the {@link Ext.Panel panel}
	 * is being rendered. This will add the event handler for selection changes, and
	 * will load the hierarchy model.
	 * @param {Ext.Container} ct The parent container for this panel
	 * @param {Number} position The position of this panel inside its parent
	 * @private
	 */
	onRender : function(ct, position)
	{
		Zarafa.common.dialogs.CopyMovePanel.superclass.onRender.call(this, ct, position);

		if (this.objectType == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE) {
			this.setTitle(String.format(ngettext('There is {0} message selected.', 'There are {0} messages selected.', this.record.length), this.record.length));
		} else if (this.objectType == Zarafa.core.mapi.ObjectType.MAPI_FOLDER) {
			this.setTitle(String.format(_('Folder \'{0}\' selected.'), Ext.util.Format.htmlEncode(this.record[0].getDisplayName())));
		}
	},

	/**
	 * Initialize the event handlers
	 * @protected
	 */
	initEvents : function()
	{
		Zarafa.common.dialogs.CopyMovePanel.superclass.initEvents.apply(this, arguments);

		// If there is a folder we should select, the enable the 'load' event handler
		// as we will have to wait until the correct node has been loaded.
		var folder = this.dialog.getSelectedFolder();
		if (folder) {
			this.mon(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
		this.mon(this.hierarchyTree.getSelectionModel(), 'selectionchange', this.onSelectionChange, this);
	},

	/**
	 * Fired when the {@link Zarafa.hierarchy.ui.Tree Tree} fires the {@link Zarafa.hierarchy.ui.Tree#load load}
	 * event. This function will try to select the {@link Ext.tree.TreeNode TreeNode} in
	 * {@link Zarafa.hierarchy.ui.Tree Tree} intially. When the given node is not loaded yet, it will try again
	 * later when the event is fired again.
	 *
	 * @private
	 */
	onTreeNodeLoad : function() {
		// Select folder in hierarchy tree.
		var folder = this.dialog.getSelectedFolder();

		// If the folder could be selected, then unregister the event handler.
		if (this.hierarchyTree.selectFolderInTree(folder)) {
			this.mun(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
	},

	/**
	 * Event handler which is trigggered when the user select a {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
	 * from the {@link Zarafa.hierarchy.ui.Tree tree}. This will determine if a valid
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} is selected to which the {@link Zarafa.core.data.IPMRecord records}
	 * can indeed be copied or moved to.
	 * @param {DefaultSelectionModel} selectionModel The selectionModel for the treepanel
	 * @param {TreeNode} node The selected tree node
	 * @private
	 */
	onSelectionChange : function(selectionModel, node)
	{
		if (!Ext.isDefined(node) || (node.getFolder().isIPMSubTree() && this.objectType == Zarafa.core.mapi.ObjectType.MAPI_MESSAGE)) {
			this.copyButton.disable();
			this.moveButton.disable();
			this.createFolderButton.disable();
		} else {
			this.copyButton.enable();
			this.moveButton.enable();
			this.createFolderButton.enable();
		}
	},

	/**
	 * Event handler which is triggered when the user presses the Create new folder {@link Ext.Button button}.
	 * This will call {@link Zarafa.hierachy.actions.openCreateFolderContent} with the selected {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}.
	 * @private
	 */
	onCreateFolder : function()
	{
		var folder = this.hierarchyTree.getSelectionModel().getSelectedNode().getFolder();
		Zarafa.hierarchy.Actions.openCreateFolderContent(folder);
		this.mon(this.hierarchyTree, 'append', this.onTreeAppend, this, {delay: 10});
	},

	/**
	 * Event handler which is triggered when a new folder is appended to the tree and selects the newly created folder
	 * @param {Zarafa.hierarchy.ui.Tree} tree the folder tree
	 * @param {Ext.data.Node} parent the parent of the newly created node
	 * @param {Ext.data.Node} node the appended node
	 * @private
	 */
	onTreeAppend: function(tree, parent, node)
	{
		// Sometimes the 'append' is fired but the node is not rendered yet,so add a delay of 10 ms.
		if (!node.parentNode) {
			// The node is probably removed and appended again, so let's find the
			// correct node in the tree again
			node = tree.getNodeById(node.id);
		}
		tree.selectPath(node.getPath());
		this.mun(this.hierarchyTree, 'append', this.onTreeAppend, this);
	},

	/**
	 * Event handler which is triggered when the user presses the Copy
	 * {@link Ext.Button button}. This will copy all {@link Zarafa.core.data.IPMRecord records}
	 * and will close the {@link Zarafa.common.dialogs.CopyMovePanel dialog} when it is done.
	 * @private
	 */
	onCopy : function()
	{
		var folder = this.hierarchyTree.getSelectionModel().getSelectedNode().getFolder();
		var records = this.record;

		if (!Ext.isDefined(folder)) {
			return;
		}

		if (Ext.isEmpty(this.record)) {
			return;
		}


		Ext.each(records, function(record, index) {
			// When we have this panel open and we receive a new email, the records store is
			// not accessible anymore, so we need to get a new record by the entryid of the old record.
			if(this.objectType === Zarafa.core.mapi.ObjectType.MAPI_MESSAGE && !record.getStore()) {
				record = records[index] = this.store.getById(record.id);
			}
			record.copyTo(folder);
		}, this);

		this.dialog.selectFolder(folder);

		this.store.save(records);

		this.dialog.close();
	},

	/**
	 * Event handler which is triggered when the user presses the Move
	 * {@link Ext.Button button}. This will move all {@link Zarafa.core.data.IPMRecord records}
	 * and will close the {@link Zarafa.common.dialogs.CopyMovePanel dialog} when it is done.
	 * @private
	 */
	onMove : function()
	{
		var folder = this.hierarchyTree.getSelectionModel().getSelectedNode().getFolder();
		var records = this.record;

		if (!Ext.isDefined(folder)) {
			return;
		}

		if (Ext.isEmpty(this.record)) {
			return;
		}


		Ext.each(records, function(record, index) {
			// When we have this panel open and we receive a new email, the records store is
			// not accessible anymore, so we need to get a new record by the entryid of the old record.
			if(this.objectType === Zarafa.core.mapi.ObjectType.MAPI_MESSAGE && !record.getStore()) {
				record = records[index] = this.store.getById(record.id);
			}
			record.moveTo(folder);
		}, this);

		this.dialog.selectFolder(folder);

		this.store.save(records);

		this.dialog.close();
	},

	/**
	 * Event handler which is triggered when the user presses the cancel
	 * {@link Ext.Button button}. This will close the {@link Zarafa.common.dialogs.CopyMovePanel dialog}
	 * without copying or moving any {@link Zarafa.core.data.IPMRecord records}.
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	}
});

Ext.reg('zarafa.copymovepanel', Zarafa.common.dialogs.CopyMovePanel);
