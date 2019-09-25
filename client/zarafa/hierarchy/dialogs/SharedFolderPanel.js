/*
 * #dependsFile client/zarafa/hierarchy/data/SharedFolderTypes.js
 */
Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.SharedFolderPanel
 * @extends Ext.Panel
 * @xtype zarafa.sharedfolderpanel
 */
Zarafa.hierarchy.dialogs.SharedFolderPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.hierarchy.data.SharedFolderTypes} defaultSelectedFolderType Default selected folder in combolist.
	 */
	defaultSelectedFolderType : Zarafa.hierarchy.data.SharedFolderTypes['ALL'],

	/**
	 * @cfg {Zarafa.core.data.IPMRecipientStore} store The store in which the user is stored which
	 * will contain the user whose store we wish to open.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			layout: 'form',
			border: false,
			labelWidth : 87,
			flex : 1,
			items: [
				this.createRecipientField(config.store),
				this.createFolderTypeCombo(config.defaultSelectedFolderType),
				this.createSubfolderSelection()
			]
		});

		Zarafa.hierarchy.dialogs.SharedFolderPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates recipient selection field.
	 * @param {Zarafa.core.data.IPMRecipientStore} store The store to hook into the RecipientField
	 * @return {Object} config object for creating recipient selection field.
	 * @private
	 */
	createRecipientField : function(store)
	{
		return {
			xtype: 'zarafa.compositefield',
			hideLabel: true,
			style : 'margin-top: 10px; margin-bottom: 10px;',
			anchor :'100%',
			items: [{
				xtype: 'button',
				anchor: '100%',
				text: _('Name') + ':',
				handler: this.onSelectUser,
				scope: this
			},{
				xtype: 'zarafa.addressbookboxfield',
				ref: '../userField',
				boxStore : store,
				flex: 1,
				boxLimit : 1,
				boxConfig : {
					validDisplayType : Zarafa.core.mapi.DisplayType.DT_MAILUSER
				}
			}]
		};
	},

	/**
	 * Creates folder type selection combo,
	 * To chose which type of shared folder user want to open.
	 * @param {Zarafa.hierarchy.data.SharedFolderTypes} defaultSelectedFolderType The folder type which will be
	 * selected by default
	 * @return {Object} config object for creating folder type selection combo.
	 * @private
	 */
	createFolderTypeCombo : function(defaultSelectedFolderType)
	{
		return {
			xtype : 'combo',
			fieldLabel : _('Folder type'),
			typeAhead : true,
			triggerAction : 'all',
			lazyRender : true,
			mode : 'local',
			style : 'margin-bottom: 10px;',
			anchor :'100%',
			value : defaultSelectedFolderType,
			store : new Ext.data.JsonStore({
				fields: ['value', 'name'],
				data : Zarafa.hierarchy.data.SharedFolderTypes.folders
			}),
			lazyInit: false,
			editable: false,
			displayField: 'name',
			valueField: 'value',
			ref : 'folderTypeCombo',
			listeners : {
				select : this.onFolderTypeSelect,
				scope: this
			}
		};
	},

	/**
	 * Creates subfolder selection checkbox,
	 * To chose whether user want to open subfolders of the shared folders.
	 * @return {Object} config object for subfolder selection checkbox.
	 * @private
	 */
	createSubfolderSelection : function()
	{
		return {
			xtype : 'checkbox',
			ref: 'checkSubFolders',
			boxLabel : _('Show subfolders'),
			anchor :'100%'
		};
	},

	/**
	 * Called by ExtJs during rendering of the component. This will call
	 * {@link #updateSubFolderCheckBox} to initialize the dialog.
	 * @private
	 */
	onRender : function()
	{
		Zarafa.hierarchy.dialogs.SharedFolderPanel.superclass.onRender.apply(this, arguments);
		this.updateSubFolderCheckBox();
	},

	/**
	 * Event handler which is fired when the user presses the 'Name' button.
	 * This will open the Address Book User Selection Dialog to select a user.
	 * @private
	 */
	onSelectUser : function()
	{
		Zarafa.common.Actions.openABUserSelectionContent({
			callback : this.abCallBack,
			scope : this,
			hideContactsFolders : true,
			listRestriction : {
				hide_users : [ 'contact', 'system' ],
				hide_groups : true,
				hide_companies : true
			}
		});
	},

	/**
	 * Callback function for {@link Zarafa.addressbook.dialogs.ABUserSelectionContentPanel AddressBook}
	 * @param {Ext.data.Record} record user selected from AddressBook
	 * @private
	 */
	abCallBack : function(record)
	{
		this.store.removeAll();
		this.store.add(record.convertToRecipient());
	},

	/**
	 * Called when the user selects a different Folder Type from the ComboBox.
	 * This will call {@link #updateSubFolderCheckBox}.
	 * @param {Ext.form.ComboBox} field The combobox which was changed
	 * @param {Mixed} newValue The new value which was selected
	 * @private
	 */
	onFolderTypeSelect : function(field, newValue)
	{
		this.updateSubFolderCheckBox();
	},

	/**
	 * This will enabled/disable the "Show Subfolders" checkbox depending if the
	 * Folder Type selection is for the {@link Zarafa.common.data.FolderContentTypes#ipmsubtree} or not.
	 * @private
	 */
	updateSubFolderCheckBox : function()
	{
		var enabled = this.folderTypeCombo.getValue() !== Zarafa.hierarchy.data.SharedFolderTypes['ALL'];
		this.checkSubFolders.setDisabled(!enabled);
	},

	/**
	 * Obtain the options which are currently selected in the form.
	 * @return {Object} The Shared Folder options which were selected
	 */
	getFolderOptions : function()
	{
		return {
			type : this.folderTypeCombo.getValue(),
			subfolders : this.checkSubFolders.getValue()
		};
	}
});

Ext.reg('zarafa.sharedfolderpanel', Zarafa.hierarchy.dialogs.SharedFolderPanel);
