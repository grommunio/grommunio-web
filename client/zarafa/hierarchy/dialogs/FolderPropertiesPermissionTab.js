Ext.namespace('Zarafa.hierarchy.dialogs');

/**
 * @class Zarafa.hierarchy.dialogs.FolderPropertiesPermissionTab
 * @extends Ext.Panel
 * @xtype zarafa.folderpropertiespermissiontab
 * 
 * Permissions tab in the {@link Zarafa.hierarchy.dialogs.FolderPropertiesContentPanel}
 * that is used to set permissions on folder for other users.
 */
Zarafa.hierarchy.dialogs.FolderPropertiesPermissionTab = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			xtype: 'zarafa.folderpropertiespermissiontab',
			cls : 'tab-permissions',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border : false,
			bodyStyle : 'background-color: inherit;',
			items: [
				this.createUserListPanel(),
				this.createProfilePanel(),
				this.createPermissionPanel()
			]
		});

		Zarafa.hierarchy.dialogs.FolderPropertiesPermissionTab.superclass.constructor.call(this, config);
	},

	/**
	 * @return {Object} Configuration object for the panel which shows users to which permissions are set
	 * @private
	 */
	createUserListPanel : function()
	{
		return {
			xtype : 'panel',
			cls : 'userlist-panel',
			layout : 'fit',
			flex : 1,
			border: false,
			items : [{
				xtype : 'grid',
				ref : '../userView',
				store : new Zarafa.hierarchy.data.MAPIFolderPermissionsSubStore(),
				hideHeaders : true,
				enableHdMenu : false,
				border: true,
				viewConfig : {
					forceFit : true,
					deferEmptyText: false,	
					emptyText: '<div class="emptytext">' + _('No permissions granted') + '</div>'
				},
				sm : new Ext.grid.RowSelectionModel({
					singleSelect : true,
					listeners : {
						selectionchange : this.onUserSelectionChange,
						scope : this
					}
				}),
				columns : [{
					dataIndex : 'display_name',
					header : '&#160;',
					renderer : Ext.util.Format.htmlEncode
				}],
				listeners : {
					viewready : this.onViewReady,
					scope : this
				}
			}],
			buttons : [{
				text : _('Add'),
				ref : '../../addUserBtn',
				handler : this.onUserAdd,
				scope : this,
				autoWidth : false
			},{
				text : _('Remove'),
				ref : '../../removeUserBtn',
				handler : this.onUserRemove,
				scope : this,
				autoWidth : false
			}]
		};
	},

	/**
	 * @return {Object} Configuration object for the panel for permissions
	 * @private
	 */
	createProfilePanel : function()
	{
		var profileStore = {
			xtype: 'jsonstore',
			fields: ['name', 'value'],
			data : Zarafa.hierarchy.data.PermissionProfiles
		};

		return {
			xtype : 'panel',
			layout : 'fit',
			cls : 'profile-panel',
			autoHeight : true,
			border : false,
			items : {
				xtype : 'container',
				autoHeight : true,
				items : [{
					xtype : 'form',
					layout : {
						type: 'table',
						columns : 2
					},
					border : false,
					ref : '../profileForm',
					items : [{
						xtype : 'label',
						autoWidth : true,
						autoHeight : true,
						forId : 'profile-combo',
						hideLabel : false,
						text : _('Profile') + ':',
						ref : '../../profileLabel'
					},{
						xtype : 'combo',
						ref : '../../../profileCombo',
						width: 122,
						flex : 1,
						id: 'profile-combo',
						fieldLabel : _('Profile'),
						labelWidth : undefined,
						labelStyle : 'width: auto',
						hideLabel : true,
						autoHeight : true,
						store: profileStore,
						mode: 'local',
						triggerAction: 'all',
						displayField: 'name',
						valueField: 'value',
						lazyInit: false,
						autoSelect : true,
						forceSelection: true,
						editable: false,
						defaultValue : Zarafa.core.mapi.Rights.RIGHTS_NO_RIGHTS,
						listeners : {
							select : this.onProfileSelect,
							scope : this
						}
					}]
				}]
			}
		};
	},

	/**
	 * @return {Object} Configuration object for the panel for permissions
	 * @private
	 */
	createPermissionPanel : function()
	{
		return {
			xtype : 'form',
			layout : 'fit',
			cls : 'permissions-panel',
			autoHeight : true,
			border : false,
			ref : 'permissionsForm',
			items : [{
				xtype : 'fieldset',
				autoHeight : true,
				autoWidth : true,
				cls : 'zarafa-fieldset',
				items : [{
					xtype : 'container',
					layout : 'column',	
					items : [{
						xtype : 'checkboxgroup',
						columnWidth : 0.5,
						style : 'margin-right: 2px;',
						hideLabel : true,
						columns : 1,
						items : [{
							xtype : 'checkbox',
							boxLabel : _('Create items'),
							rightsValue : Zarafa.core.mapi.Rights.RIGHTS_CREATE
						},{
							xtype : 'checkbox',
							boxLabel : _('Read items'),
							rightsValue : Zarafa.core.mapi.Rights.RIGHTS_READ_ANY
						},{
							xtype : 'checkbox',
							boxLabel : _('Create subfolders'),
							rightsValue : Zarafa.core.mapi.Rights.RIGHTS_CREATE_SUBFOLDER
						}],
						listeners : {
							change : this.onPermissionChecked,
							scope : this
						}
					},{
						xtype : 'checkboxgroup',
						columnWidth : 0.5,
						style : 'margin-left: 2px;',
						hideLabel : true,
						columns : 1,
						items : [{
							xtype : 'checkbox',
							boxLabel : _('Folder permissions'),
							rightsValue : Zarafa.core.mapi.Rights.RIGHTS_FOLDER_ACCESS
						},{
							xtype : 'checkbox',
							boxLabel : _('Folder visible'),
							rightsValue : Zarafa.core.mapi.Rights.RIGHTS_FOLDER_VISIBLE
						}],
						listeners : {
							change : this.onPermissionChecked,
							scope : this
						}
					}]
				},{
					xtype : 'container',
					layout : 'column',
					items : [{
						xtype : 'fieldset',
						columnWidth : 0.5,
						cls : 'zarafa-fieldset',
						title : _('Edit items'),
						items : [{
							xtype : 'radiogroup',
							columns: 1,
							hideLabel : true,
							items : [{
								name: 'allowedit',
								boxLabel: _('None'),
								hideLabel : true,
								rightsValue: Zarafa.core.mapi.Rights.RIGHTS_NONE
							},{
								name: 'allowedit',
								boxLabel: _('Own'),
								hideLabel : true,
								rightsValue: Zarafa.core.mapi.Rights.RIGHTS_EDIT_OWNED
							},{
								name: 'allowedit',
								boxLabel: _('All'),
								hideLabel : true,
								rightsValue: Zarafa.core.mapi.Rights.RIGHTS_EDIT_ANY | Zarafa.core.mapi.Rights.RIGHTS_EDIT_OWNED
							}],
							listeners : {
								change : this.onPermissionChecked,
								scope : this
							}
						}]
					},{
						xtype : 'fieldset',
						columnWidth : 0.5,
						cls : 'zarafa-fieldset',
						title : _('Delete items'),
						items : [{
							xtype : 'radiogroup',
							columns: 1,
							hideLabel : true,
							items : [{
								name: 'allowdelete',
								boxLabel: _('None'),
								hideLabel : true,
								rightsValue: Zarafa.core.mapi.Rights.RIGHTS_NONE
							},{
								name: 'allowdelete',
								boxLabel: _('Own'),
								hideLabel : true,
								rightsValue: Zarafa.core.mapi.Rights.RIGHTS_DELETE_OWNED
							},{
								name: 'allowdelete',
								boxLabel: _('All'),
								hideLabel : true,
								rightsValue: Zarafa.core.mapi.Rights.RIGHTS_DELETE_ANY | Zarafa.core.mapi.Rights.RIGHTS_DELETE_OWNED
							}],
							listeners : {
								change : this.onPermissionChecked,
								scope : this
							}
						}]
					}]
				}]
			}]
		};
	},

	/**
	 * Event handler which is fired when the user presses the "Add" button to add a new
	 * user to the permission store. This will call {@link Zarafa.common.Actions#openABUserSelectionContent}
	 * to open the addressbook selection content panel.
	 * @private
	 */
	onUserAdd : function()
	{
		Zarafa.common.Actions.openABUserSelectionContent({
			callback : this.onUserSelected,
			scope : this,
			hierarchyRestriction : {
				hide_contacts : true
			},
			listRestriction : { 
				hide_users : [ 'non_security' ],
				hide_groups : [ 'non_security' ],
				hide_companies : [ 'non_security' ]
			}
		});
	},

	/**
	 * Event handler for the {@link Zarafa.common.Actions#openABUserSelectionContent} function,
	 * which is used to select a user to be added to the permissions store.
	 * @param {Zarafa.addressbook.AddressBookRecord} record The selected user/group
	 * @private
	 */
	onUserSelected : function(record)
	{
		var store = this.userView.getStore();
		var permission = record.convertToUserPermission();

		if (store.findExact('entryid', permission.get('entryid')) < 0) {
			store.add(permission);
			this.userView.getSelectionModel().selectRecords([permission]);
		} else {
			var msg; 
			if (permission.get('object_type') === Zarafa.core.mapi.ObjectType.MAPI_MAILUSER) {
				msg = _('User already exists');
			} else {
				msg = _('Group already exists');
			}
			container.getNotifier().notify('error.permissions', _('Error'), msg, {
				container : this.getEl()
			});
		}
	},

	/**
	 * Event handler which is fired when the user presses the "Remove' button. This will
	 * remove the currently selected user from the permissions store.
	 * @private
	 */
	onUserRemove : function()
	{
		var store = this.userView.getStore();
		var selection = this.userView.getSelectionModel().getSelected();

		if (this.selectedUser === selection) {
			this.clearPermissionsForm();
		}
		store.remove(selection);
	},

	/**
	 * Check if the given permissions masks can be represented by a
	 * {@link Zarafa.hierarchy.data.PermissionProfiles profile}. If it doesn't
	 * match anyting the 'Other' profile will be displayed in the profile combobox.
	 * @param {Number} permissions The permissions to load
	 * @private
	 */
	updateProfileCombo : function(permissions)
	{
		var store = this.profileCombo.store;

		// Check if the given permissions mask is set on one
		// of the profiles in the combobox. If that is the case,
		// then we enable that profile, and otherwise we apply
		// 'null' to ensure that the 'Other' profile is selected.
		var index = store.findExact('value', permissions);
		if (index >= 0) {
			this.profileCombo.setValue(permissions);
		} else {
			this.profileCombo.setValue(null);
		}
	},

	/**
	 * Load a permissions mask into the {@link Ext.form.CheckboxGroup} or {@Link Ext.form.RadioGroup}.
	 * This will toggle all radios and checkboxes to ensure they reflect the given permission mask.
	 * @param {Ext.form.CheckboxGroup} group The group to update
	 * @param {Number} permissions The permission mask to load into the group
	 * @private
	 */
	loadPermissionToGroup : function(group, permissions)
	{
		var items = group.items;

		group.suspendEvents(false);
		if (group instanceof Ext.form.RadioGroup) {
			var none = items.get(0);
			var own = items.get(1);
			var all = items.get(2);

			if ((permissions & all.rightsValue) === all.rightsValue) {
				none.setValue(false);
				own.setValue(false);
				all.setValue(true);
			} else if ((permissions & own.rightsValue) === own.rightsValue) {
				none.setValue(false);
				all.setValue(false);
				own.setValue(true);
			} else {
				own.setValue(false);
				all.setValue(false);
				none.setValue(true);
			}
		} else {
			for (var i = 0, len = items.getCount(); i < len; i++) {
				var option = items.get(i);
				if (Ext.isDefined(option.rightsValue)) {
					var enabled = (permissions & option.rightsValue) === option.rightsValue;
					option.setValue(enabled);
				}
			}
		}
		group.resumeEvents();
	},

	/**
	 * Read a {@link Ext.form.CheckboxGroup} or {@Link Ext.form.RadioGroup} to detect which
	 * permissions have been enabled in the group. This will be applied to the given
	 * permissions argument
	 * @param {Ext.form.CheckboxGroup} group The group to read
	 * @param {Number} permissions The current permissions value which must be updated by this group
	 * @return {Number} The updated permissions value
	 * @private
	 */
	updatePermissionFromGroup : function(group, permissions)
	{
		var mask = 0;
		var flag = 0;

		group.items.each(function(item) {
			if (Ext.isDefined(item.rightsValue)) {
				mask |= item.rightsValue;
				if (item.checked) {
					flag |= item.rightsValue;
				}
			}
		});

		return (permissions & ~mask) | flag;
	},

	/**
	 * Load the given {@link Zarafa.core.mapi.Rights permissions mask} into the UI.
	 * This will detect which profile must be enabled, and toggle all required
	 * {@link Ext.form.CheckBox  checkboxes} and {@link Ext.form.Radio radios}.
	 * @param {Number} permissions Mask of {@link Zarafa.core.mapi.Rights rights values}.
	 * @private
	 */
	loadPermissionValue : function(permissions)
	{
		this.updateProfileCombo(permissions);

		// Search for all checkbox and radiogroups,
		// and start toggle the appropriate components
		// based on the given mask.
		this.permissionsForm.cascade(function(item) {
			if (item instanceof Ext.form.CheckboxGroup) {
				this.loadPermissionToGroup(item, permissions);
			}
		}, this);
	},

	/**
	 * Read the UI to determine the {@link Zarafa.core.mapi.Rights permissions mask}
	 * which is currently enabled. This will read if a predefined profile is selected,
	 * or will otherwise read all the {@link Ext.form.CheckBox  checkboxes} and
	 * {@link Ext.form.Radio radios} to generate the value.
	 * @returns {Number} Mask of {@link Zarafa.core.mapi.Rights rights values}.
	 * @private
	 */
	updatePermissionValue : function()
	{
		var permissions = 0;

		// Search for all checkbox and radiogroups,
		// and apply the value to the permissions mask
		// from the toggled components
		this.permissionsForm.cascade(function(item) {
			if (item instanceof Ext.form.CheckboxGroup) {
				permissions = this.updatePermissionFromGroup(item, permissions);
			}
		}, this);

		return permissions;
	},

	/**
	 * Update the {@link #selectedUser} and update the contents
	 * of the entire permissions form
	 * @param {Zarafa.hierarchy.data.UserPermissionRecord} user The user to load into the form
	 * @private
	 */
	loadPermissionsForm : function(user)
	{
		this.selectedUser = user;
		this.removeUserBtn.enable();
		this.permissionsForm.getForm().items.each(function(item) { item.enable(); });
		this.loadPermissionValue(user.get('rights'));
	},

	/**
	 * Clear the {@link #selectedUser} and clear the contents
	 * of the entire permissions form
	 * @private
	 */
	clearPermissionsForm : function()
	{
		this.selectedUser = undefined;
		this.loadPermissionValue(this.profileCombo.defaultValue);
		this.removeUserBtn.disable();
		this.permissionsForm.getForm().items.each(function(item) { item.disable(); });
	},

	/**
	 * Event fired when the Permissions {@link Ext.grid.GridPanel grid} fires the
	 * {@link Ext.grid.GridPanel#viewready viewready} event. This will check a
	 * {@link #record} has been set, and if so it will select the first
	 * record on the 'folders' substore.
	 * @private
	 */
	onViewReady : function()
	{
		if (this.record && this.record.isOpened()) {
			var store = this.record.getSubStore('permissions');
			if (store.getCount() > 0) {
				this.userView.getSelectionModel().selectFirstRow();
			}
		}
	},

	/**
	 * Event handler which is fired when the user selects a user/group
	 * from the userlist.
	 * @param {Ext.grid.RowSelectionModel} selectionmodel The selectionmodel which fired the event
	 * @private
	 */
	onUserSelectionChange : function(selectionModel)
	{
		var record = selectionModel.getSelected();

		if (!Ext.isEmpty(record)) {
			this.loadPermissionsForm(record);
		} else {
			this.clearPermissionsForm();
		}
	},

	/**
	 * Event handler which is fired when the user selects a profile from
	 * the dropdown box.
	 * @param {Ext.form.ComboBox} combo The combobox which fired the event
	 * @param {Ext.data.Record} record The record which was selected
	 * @param {Number} index The selected index
	 * @private
	 */
	onProfileSelect : function(combo, record, index)
	{
		var permissions = record.get('value');
		if (permissions !== null) {
			this.loadPermissionValue(permissions);
			if (this.selectedUser) {
				this.selectedUser.set('rights', permissions);
			}
		}
	},

	/**
	 * Event handler which is fired when a {@link Ext.form.CheckBox} or {@link Ext.form.Radio}
	 * has been toggled. This will update the rights property inside the {@link #selectedUser}
	 * and check if the new permissions match a profile in the combobox.
	 * @param {Ext.form.CheckboxGroup} group The group to which the checkbox or radio belongs
	 * @param {Boolean} True if the checkbox is enabled or not
	 * @private
	 */
	onPermissionChecked : function(group, checked)
	{
		var permissions;
		if (this.selectedUser) {
			permissions = this.selectedUser.get('rights');
			permissions = this.updatePermissionFromGroup(group, permissions);

			this.selectedUser.set('rights', permissions);
			this.updateProfileCombo(permissions);
		} else {
			permissions = this.updatePermissionValue();
			this.updateProfileCombo(permissions);
		}
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.record = record;

		if (contentReset && record.isOpened()) {

			var store = record.getSubStore('permissions');
			this.userView.reconfigure(store, this.userView.getColumnModel());
			if (store.getCount() > 0) {
				this.userView.getSelectionModel().selectFirstRow();
			} else {
				this.clearPermissionsForm();
			}
		}
	},

	/**
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord : function(record)
	{
		if (this.selectedUser) {
			var permissions = this.updatePermissionValue();
			this.selectedUser.set('rights', permissions);
		}
	}
});

Ext.reg('zarafa.folderpropertiespermissiontab', Zarafa.hierarchy.dialogs.FolderPropertiesPermissionTab);
