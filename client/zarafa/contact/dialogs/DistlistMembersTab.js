/*
 * #dependsFile client/zarafa/contact/dialogs/DistlistMemberGridColumnModel.js
 */
Ext.namespace('Zarafa.contact.dialogs');

/**
 * @class Zarafa.contact.dialogs.DistlistMembersTab
 * @extends Ext.form.FormPanel
 * @xtype zarafa.distlistmemberstab
 *
 * This class is used to create layout of members tab panel.
 */
Zarafa.contact.dialogs.DistlistMembersTab = Ext.extend(Ext.form.FormPanel, {
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
			xtype : 'zarafa.distlistmemberstab',
			cls: 'zarafa-distlist-createpanel-memberstab',
			title : _('Members'),
			layout : 'vbox',
			layoutConfig: {
				align : 'stretch',
				pack  : 'start'
			},
			defaults : {
				header : false,
				margins : {top:0, right:0, bottom:6, left:0},
				border : false
			},
			items: this.getMembersTabItems()
		});

		Zarafa.contact.dialogs.DistlistMembersTab.superclass.constructor.call(this, config);
	},

	/**
	 * Function will return items for members tab.
	 */
	getMembersTabItems : function()
	{
		return [{
					layout:'form',
					items: [{
						xtype : 'textfield',
						name : 'subject',
						labelStyle: 'text-align: left',
						fieldLabel: _('Name'),
						anchor : '100%',
						listeners :{
							change : this.onPropertyChange,
							scope : this
						}
					}]
				},{
					layout:'table',
					cls: 'buttons',
					layoutConfig: {
						columns: 5
					},
					items: [{
						xtype : 'button',
						autoWidth: true,
						text : _('Select Members') + '...',
						handler : this.showAddressBookContent,
						scope : this
					},{
						xtype: 'spacer',
						width: 6
					},{
						xtype : 'button',
						autoWidth: true,
						handler : this.addExternalMember,
						scope: this,
						text : _('Add New') + '...'
					},{
						xtype: 'spacer',
						width: 6
					},{
						xtype : 'button',
						autoWidth: true,
						text : _('Remove'),
						handler : this.removeMembers,
						scope: this
					}]
				},{
					xtype: 'grid',
					flex: 1,
					viewConfig: {
						autoFill: true
					},
					// provide a dummy store when rendering components
					// this will be replaced by recipient store when record data
					// will be available in the dialog
					store: new Ext.data.Store({
						autoDestroy: true
					}),
					listeners : {
						rowdblclick : this.onRowDblClick
					},
					ref: 'membersGrid',
					autoExpandColumn : 'display_name',
					colModel: new Zarafa.contact.dialogs.DistlistMemberGridColumnModel()
				}];
	},

	/**
	 * Load record into form
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to load
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if(Ext.isEmpty(record)) {
			return;
		}

		this.record = record;

		this.getForm().loadRecord(record);

		// Assign a store to members grid.
		if(contentReset && record.isOpened()) {
			// apply sorting
			record.getMemberStore().sort('fileas', 'asc');

			// reconfigure grid to use member store
			this.membersGrid.reconfigure(record.getMemberStore(), this.membersGrid.colModel);
		}
	},

	/**
	 * Update record from form, Get values from the form.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @private
	 */
	updateRecord : function(record)
	{
		record.beginEdit();

		this.getForm().updateRecord(record);

		// Also set subject dependant properties.
		record.set('fileas', record.get('subject'));
		record.set('display_name', record.get('subject'));

		record.endEdit();
	},

	/**
	 * Function Opens a {@link Zarafa.addressbook.dialogs.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 * to select members from addressbook.
	 */
	showAddressBookContent : function()
	{
		Zarafa.contact.Actions.openMembersSelectionContent(this.record);
	},

	/**
	 * Function will open {@link Zarafa.contact.dialogs.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 * for adding external member.
	 */
	addExternalMember : function()
	{
		Zarafa.contact.Actions.openDistlistExternalMemberContent(undefined, { parentRecord : this.record });
	},

	/**
	 * Function will remove selected members from the membersGrid.
	 */
	removeMembers : function()
	{
		var store = this.record.getMemberStore();
		var selectedRecords = this.membersGrid.getSelectionModel().getSelections();

		store.remove(selectedRecords);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onPropertyChange : function(field, newValue, oldValue)
	{
		this.record.set(field.getName(), newValue);
	},

	/**
	 * Event handler which is fired when a row in the grid has been double-clicked.
	 * This will open the selected addressbook item in a new dialog.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The index of the row which was double clicked
	 * @param {Ext.EventObject} event The event
	 */
	onRowDblClick : function(grid, rowIndex, event)
	{
		var record = this.getStore().getAt(rowIndex);
		Zarafa.contact.Actions.openDistlistMember(record, this.record);
	}
});

Ext.reg('zarafa.distlistmemberstab', Zarafa.contact.dialogs.DistlistMembersTab);

