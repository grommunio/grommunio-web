Ext.namespace('Zarafa.plugins.files.backend.Default.ui');

/**
 * @class Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel
 * @extends Ext.form.FormPanel
 * @xtype filesplugin.default.filesshareusereditpanel
 *
 * This content panel contains the sharing edit panel.
 */
Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel = Ext.extend(
	Ext.form.FormPanel,
	{
		/**
		 * @cfg {Ext.record} Ext.record to be edited
		 */
		record: undefined,

		/**
		 * @cfg {Ext.data.arrayStore} store holding the user and group share data
		 */
		store: undefined,

		/**
		 * @cfg {String} record id of the parent files record
		 */
		recordId: undefined,

		/**
		 * @constructor
		 * @param config
		 */
		constructor: function (config) {
			if (config.record) {
				this.record = config.record;
			}

			if (config.store) {
				this.store = config.store;
			}

			if (config.recordId) {
				this.recordId = config.recordId;
			}

			Ext.applyIf(config || {}, {
				labelAlign: 'left',
				defaultType: 'textfield',
				items: this.createPanelItems(),
				buttons: [
					{
						text: _('Save'),
						handler: this.doSave,
						scope: this,
					},
					{
						text: _('Cancel'),
						handler: this.doClose,
						scope: this,
					},
				],
			});

			Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Eventhandler for the Cancel button, closing this dialog
		 */
		doClose: function () {
			this.ownerCt.dialog.close();
		},

		/**
		 * Save the share data to the share gridstore.
		 * Create a new record or update an existing one.
		 */
		doSave: function () {
			var recipientRecord = this.shareWith
				.getStore()
				.getAt(this.shareWith.selectedIndex);
			if (this.record) {
				this.record.beginEdit();
				// When we have a recipientRecord here, this means the user has refreshed or changed it.
				// Otherwise we just keep the original values and update the permissions.
				if (recipientRecord) {
					this.record.set('type', this.type.getValue());
					this.record.set('shareWith', recipientRecord.data.shareWith);
					this.record.set(
						'shareWithDisplayname',
						recipientRecord.data.display_name,
					);
				}
				this.record.set('permissionShare', this.permissionShare.getValue());
				this.record.set('permissionChange', this.permissionChange.getValue());
				this.record.set(
					'permissionCreate',
					this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
						? this.permissionCreate.getValue()
						: false,
				);
				this.record.set(
					'permissionDelete',
					this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
						? this.permissionDelete.getValue()
						: false,
				);
				this.record.endEdit();
			} else {
				var record = new this.store.recordType({
					id: -1,
					type: this.type.getValue(),
					shareWith: recipientRecord.data.shareWith,
					shareWithDisplayname: recipientRecord.data.display_name,
					permissionCreate:
						this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
							? this.permissionCreate.getValue()
							: false,
					permissionChange: this.permissionChange.getValue(),
					permissionDelete:
						this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
							? this.permissionDelete.getValue()
							: false,
					permissionShare: this.permissionShare.getValue(),
				});
				this.store.add(record);
			}
			this.ownerCt.dialog.close();
		},

		/**
		 * Function will create panel items for {@link Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel FilesShareUserEditPanel}
		 * @return {Array} array of items that should be added to panel.
		 * @private
		 */
		createPanelItems: function () {
			var type = 'user'; // user or group
			var shareWith = ''; // user/group name
			var shareWithDisplayname = ''; // user/group displayname
			var permissionCreate = false;
			var permissionChange = false;
			var permissionDelete = false;
			var permissionShare = false;
			if (this.record) {
				type = this.record.get('type');
				shareWith = this.record.get('shareWith');
				shareWithDisplayname = this.record.get('shareWithDisplayname');
				permissionShare = this.record.get('permissionShare');
				permissionChange = this.record.get('permissionChange');
				if (
					this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
				) {
					permissionCreate = this.record.get('permissionCreate');
					permissionDelete = this.record.get('permissionDelete');
				}
			}

			var permissionItems = [
				{
					xtype: 'checkbox',
					fieldLabel: _('Re-share'),
					name: 'permissionShare',
					ref: '../permissionShare',
					checked: permissionShare,
				},
				{
					xtype: 'checkbox',
					fieldLabel: _('Change'),
					name: 'permissionChange',
					ref: '../permissionChange',
					checked: permissionChange,
				},
			];
			if (this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				permissionItems.push(
					{
						xtype: 'checkbox',
						fieldLabel: _('Create'),
						name: 'permissionCreate',
						ref: '../permissionCreate',
						checked: permissionCreate,
					},
					{
						xtype: 'checkbox',
						fieldLabel: _('Delete'),
						name: 'permissionDelete',
						ref: '../permissionDelete',
						checked: permissionDelete,
					},
				);
			}

			return [
				{
					xtype: 'filesplugin.default.usergrouppredictorfield',
					fieldLabel: _('Share with'),
					name: 'shareWith',
					ref: 'shareWith',
					allowBlank: false,
					value: shareWithDisplayname,
					recordId: this.recordId,
				},
				{
					xtype: 'selectbox',
					fieldLabel: _('Type'),
					name: 'type',
					ref: 'type',
					allowBlank: false,
					value: type,
					store: [
						['user', 'User'],
						['group', 'Group'],
					],
					mode: 'local',
				},
				{
					xtype: 'fieldset',
					title: _('Permissions'),
					defaults: {
						labelWidth: 89,
						anchor: '100%',
						xtype: 'textfield',
					},
					items: permissionItems,
				},
			];
		},
	},
);

Ext.reg(
	'filesplugin.default.filesshareusereditpanel',
	Zarafa.plugins.files.backend.Default.ui.FilesShareUserEditPanel,
);
