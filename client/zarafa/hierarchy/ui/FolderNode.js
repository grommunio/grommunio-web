Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.FolderNode
 * @extends Ext.tree.AsyncTreeNode
 *
 * This will register itself as 'folder' nodetype in the {@link Ext.tree.TreePanel#nodeTypes} object.
 */
Zarafa.hierarchy.ui.FolderNode = Ext.extend(Ext.tree.AsyncTreeNode, {
	/**
	 * @cfg {Zarafa.core.data.IPFRecord} folder the folder for which this tree node will be created
	 */
	folder : undefined,

	/**
	 * @cfg {Boolean} isNodeSelected the isNodeSelected is true when the folder is selected or checked, false otherwise.
	 */
	isNodeSelected : false,

	/**
	 * @cfg {String/Ext.XTemplate} tpl The template which must be applied on the {@link #text} for
	 * rendering into the {@link Ext.tree.TreePanel tree}.
	 */
	tpl : new Ext.XTemplate('{text:htmlEncode}', { compiled : true }),
	
	/*
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var folder = config.folder;

		// If a folder is provided we have an extra oppurtunity to
		// apply some extra defaults.
		if (Ext.isDefined(folder)) {
			Ext.applyIf(config, {
				id :folder.get('entryid')
			});
		}

		Ext.applyIf(config, {
			containerCls : 'zarafa-tree-container',
			cls: 'zarafa-tree-node'
		});

		Zarafa.hierarchy.ui.FolderNode.superclass.constructor.call(this, config);

		if (Ext.isString(this.tpl)) {
			this.tpl = new Ext.XTemplate(this.tpl, { compiled : true });
		}

		if (folder) {
			this.updateUI(folder);
		}
	},

	/**
	 * @return {Zarafa.core.data.IPFRecord} The folder which is represented by this node
	 */
	getFolder : function()
	{
		return this.attributes.folder;
	},

	/**
	 * Sets checked status to the passed value
	 * @param {Boolean} checked if true, set checked else uncheck
	 */
	setChecked : function(checked)
	{
		if (this.rendered) {
			this.getUI().toggleCheck(checked);
		}
	},

	/**
	 * @return {Boolean} true, if {@link Zarafa.hierarchy.ui.FolderNode folderNode} is checked else false
	 */
	isChecked : function()
	{
		var ui = this.getUI();
		return ui.checkbox && ui.checkbox.checked;
	},

	/**
	 * Updates UI of node
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder
	 */
	updateUI : function(folder)
	{
		// Update attributes
		this.attributes.folder = folder;

		this.updateCounterNode(folder);

		// pass the text through text renderer
		this.setText(this.getTextFromFolder(folder));

		// Only update the icon class if the icon is not an svg icon
		// Otherwise we will get errors
		if ( !this.ui.getIconEl() || this.ui.getIconEl().tagName !== 'svg' ){
			// pass the icon through the icon renderer
			this.setIcon(this.getIconFromFolder(folder));
			
			// pass the class through to the renderer
			this.setContainerCls(this.attributes.containerCls);
		}

		if (!folder.get('has_subfolder') && !folder.isFavoritesRootFolder()) {
			this.removeAll(true);
		}
	},

	/**
	 * Sets the icon for this node
	 * @param {String} iconCls
	 */
	setIcon : function(iconCls)
	{
		var oldIconCls = this.iconCls;
		this.iconCls = this.attributes.iconCls = iconCls;

		if (this.rendered) {
			this.getUI().onIconChange(this, iconCls, oldIconCls);
		}
	},
	
	/**
	 * Sets the class for this node's container
	 * @param {String} cls
	 */
	setContainerCls : function(cls)
	{
		var oldCls = this.containerCls;
		this.containerCls = this.attributes.containerCls = cls;

		if (this.rendered) {
			this.getUI().onContainerClsChange(this, cls, oldCls);
		}
	},

	/**
	 * Updates UI of counter node.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder
	 * @private
	 */
	updateCounterNode : function(folder)
	{
		if (this.rendered === true) {
			this.getUI().updateCounter(this);
		}
	},

	/**
	 * Obtain the Icon Class which must be applied to this node.
	 * This uses {@link Zarafa.common.ui.IconClass#getIconClass} to
	 * obtain the correct class for the {@link #folder}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the icon class is requested
	 * @return {String} The iconclass for this folder
	 * @protected
	 */
	getIconFromFolder : function(folder)
	{
		return Zarafa.common.ui.IconClass.getIconClass(folder);
	},

	/**
	 * Obtain the Display Name for the current {@link #folder}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The folder for which the display name is requested
	 * @return {String} The name of the folder which must be shown.
	 * @protected
	 */
	getTextFromFolder : function(folder)
	{
		return folder.getDisplayName();
	},

	/**
	 * Update the node based on the {@link #folder} data.
	 * @param {Boolean} deep True to call {@link #update} on all
	 * {@link #childNodes}.
	 */
	update : function(deep)
	{
		var folder;

		if (this.ownerTree && this.ownerTree.model) {
			folder = this.ownerTree.model.getFolder(this.getFolder().get('entryid'));
		}

		if (Ext.isDefined(folder)) {
			this.setChecked(true);
		} else {
			this.setChecked(false);
		}

		if (deep) {
			for(var i = 0, len = this.childNodes.length; i < len; i++) {
				this.childNodes[i].update(deep);
			}
		}
	}
});

Ext.tree.TreePanel.nodeTypes.folder = Zarafa.hierarchy.ui.FolderNode;
