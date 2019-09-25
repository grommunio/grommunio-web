Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.CreateFolderPanel
 * @extends Ext.Panel
 * @xtype zarafa.createfolderpanel
 */
Zarafa.hierarchy.dialogs.CreateFolderPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.hierarchy.data.MAPIFolderRecord} parentFolder (optional) The parent folder
	 * underneath the new folder will be created.
	 */
	parentFolder : undefined,
	/**
	 * @cfg {String} preferredContainerClass (optional) The preferred container
	 * class for the newly created Folder.
	 */
	preferredContainerClass : undefined,
	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			items: [ this.createPanel() ],
			buttons: [{
				text: _('Ok'),
				handler: this.onSubmit,
				scope: this
			},{
				text: _('Cancel'),
				handler: this.onCancel,
				scope: this
			}]
		});

		Zarafa.hierarchy.dialogs.CreateFolderPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates body for {@link Zarafa.hierarchy.dialogs.CreateFolderContentPanel CreateFolderContentPanel}
	 * @return {Object} Configuration object for the tree panel.
	 * @private
	 */
	createPanel : function()
	{
		return {
			xtype : 'panel',
			layout : 'form',
			border : false,
			flex : 1,
			bodyStyle : 'background-color: inherit;',
			defaults : {
				anchor :'100%',
				style : 'margin-bottom: 10px;'
			},
			labelAlign : 'top',

			items : [{
				xtype : 'textfield',
				fieldLabel : _('Name'),
				cls: 'form-field-name',
				ref : '../newNameField',
				listeners : {
					scope : this,
					specialkey : function(field, e) {
						if (e.getKey() == e.ENTER) {
							this.onSubmit();
						}
					}
				}
			},{
				xtype : 'combo',
				fieldLabel : _('Folder contains'),
				cls: 'form-field-folder-contains',
				typeAhead : true,
				triggerAction : 'all',
				lazyRender : true,
				mode : 'local',
				store : new Ext.data.ArrayStore({
					fields : [ 'value', 'displayText'],
					data : [
						['IPF.Appointment', _('Calendar Items')],
						['IPF.Note', _('Mail and Post Items')],
						['IPF.Contact', _('Contacts Items')],
						['IPF.StickyNote', _('Note Items')],
						['IPF.Task', _('Task Items')]
					]
				}),
				editable: false,
				valueField : 'value',
				displayField : 'displayText',
				ref : '../folderListCombo'
			},{
				xtype : 'zarafa.hierarchytree',
				fieldLabel : _('Select where to place the folder'),
				cls: 'form-field-hierarchy',
				border: true,
				forceLayout : true,
				anchor : '100% 65%',
				ref : '../hierarchyTree',
				treeSorter : true,
				hideTodoList: true,
				hideFavorites: true
			}]
		};
	},

	/**
	 * Initialize the event handlers
	 * @protected
	 */
	initEvents : function()
	{
		Zarafa.hierarchy.dialogs.CreateFolderPanel.superclass.initEvents.apply(this, arguments);

		// If there is a folder we should select, the enable the 'load' event handler
		// as we will have to wait until the correct node has been loaded.
		if (this.parentFolder) {
			this.mon(this.hierarchyTree, 'load', this.onTreeNodeLoad, this);
		}
		this.mon(this.hierarchyTree.getSelectionModel(), 'selectionchange', this.onHierarchyNodeSelect, this);
	},

	/**
	 * Fired when the {@link Zarafa.hierarchy.ui.Tree Tree} fires the {@link Zarafa.hierarchy.ui.Tree#load load}
	 * event. This function will try to select the {@link Ext.tree.TreeNode TreeNode} in
	 * {@link Zarafa.hierarchy.ui.Tree Tree} intially. When the given node is not loaded yet, it will try again
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
	 * Function is used to update values of form fields when ever
	 * an updated {@link Zarafa.core.data.IPMRecord record} is received.
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;
	},

	/**
	 * Fired when a node has been selected from the {@link Zarafa.hierarchy.ui.Tree HierarchyTree}.
	 * This will update the {@link Ext.form.ComboBox ComboBox} containing the container types to the
	 * selected folders container type.
	 *
	 * @param {Ext.tree.DefaultSelectionModel} model The selection model which was used to select the
	 */
	onHierarchyNodeSelect : function(model)
	{
		var node = model.getSelectedNode();
		if (node) {
			var folder = node.getFolder();

			if (folder) {
				if (this.folderListCombo.findRecord('value', folder.get('container_class'))) {
					this.folderListCombo.setValue(folder.get('container_class'));
				} else if (this.preferredContainerClass) {
					this.folderListCombo.setValue(this.preferredContainerClass);
				} else {
					// As a last resort, but this means we are setting some invalid
					// value into the combobox...
					this.folderListCombo.setValue(folder.get('container_class'));
				}
			} else if (this.preferredContainerClass) {
				this.folderListCombo.setValue(this.preferredContainerClass);
			}
		}
	},

	/**
	 * First validates submission and calls {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore} to
	 * create new folder.
	 * @private
	 */
	onSubmit : function()
	{
		if (this.newNameField.getValue().trim().length === 0) {
			Ext.MessageBox.show({
				title: _('No folder name'),
				msg: _("You must specify a name."),
				buttons: Ext.MessageBox.OK,
			});

			return;
		}

		var node = this.hierarchyTree.getSelectionModel().getSelectedNode();
		if (node) {
			var newParentFolder = node.getFolder();

			this.record.beginEdit();
			this.record.set('parent_entryid', newParentFolder.get('entryid'));
			this.record.set('store_entryid', newParentFolder.get('store_entryid'));
			this.record.set('display_name', this.newNameField.getValue());
			this.record.set('container_class', this.folderListCombo.getValue());
			this.record.endEdit();

			this.dialog.saveRecord();
		} else {
			Ext.MessageBox.show({
				title: _('No destination'),
				msg: _("You must select a destination folder."),
				buttons: Ext.MessageBox.OK,
			});

			return;
		}
	},

	/**
	 * Closes {@link Zarafa.core.ui.CreateFolderContentPanel CreateFolderContentPanel} contentpanel
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	}
});

Ext.reg('zarafa.createfolderpanel', Zarafa.hierarchy.dialogs.CreateFolderPanel);
