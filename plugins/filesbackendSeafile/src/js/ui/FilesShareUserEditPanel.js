Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Form panel that lets administrators adjust individual Seafile share settings.
 */
Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserEditPanel = Ext.extend(
	Ext.form.FormPanel,
	{
		record: undefined,
		store: undefined,
		recordId: undefined,
		constructor: function (e) {
			if (e.record) {
				this.record = e.record;
			}
			if (e.store) {
				this.store = e.store;
			}
			if (e.recordId) {
				this.recordId = e.recordId;
			}
			Ext.applyIf(e || {}, {
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
			Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserEditPanel.superclass.constructor.call(
				this,
				e,
			);
		},
		doClose: function () {
			this.ownerCt.dialog.close();
		},
		doSave: function () {
			var e = this.shareWith.getStore().getAt(this.shareWith.selectedIndex);
			if (this.record) {
				this.record.beginEdit();
				if (e) {
					this.record.set('type', this.type.getValue());
					this.record.set('shareWith', e.data.shareWith);
					this.record.set('shareWithDisplayname', e.data.display_name);
				}
				this.record.set('permissionShare', this.permissionShare.getValue());
				this.record.set('permissionChange', this.permissionChange.getValue());
				this.record.set(
					'permissionCreate',
					this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER &&
						this.permissionCreate.getValue(),
				);
				this.record.set(
					'permissionDelete',
					this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER &&
						this.permissionDelete.getValue(),
				);
				this.record.endEdit();
			} else {
				var t = new this.store.recordType({
					id: -1,
					type: this.type.getValue(),
					shareWith: e.data.shareWith,
					shareWithDisplayname: e.data.display_name,
					permissionCreate:
						this.store.fileType ===
							Zarafa.plugins.files.data.FileTypes.FOLDER &&
						this.permissionCreate.getValue(),
					permissionChange: this.permissionChange.getValue(),
					permissionDelete:
						this.store.fileType ===
							Zarafa.plugins.files.data.FileTypes.FOLDER &&
						this.permissionDelete.getValue(),
					permissionShare: this.permissionShare.getValue(),
				});
				this.store.add(t);
			}
			this.ownerCt.dialog.close();
		},
		createPanelItems: function () {
			var e = 'user';
			var t = '';
			var i = false;
			var a = false;
			var s = false;
			var r = false;
			if (this.record) {
				e = this.record.get('type');
				t = this.record.get('shareWithDisplayname');
				r = this.record.get('permissionShare');
				a = this.record.get('permissionChange');
				if (
					this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER
				) {
					i = this.record.get('permissionCreate');
					s = this.record.get('permissionDelete');
				}
			}
			var n = [
				{
					xtype: 'checkbox',
					fieldLabel: _('Re-share'),
					name: 'permissionShare',
					ref: '../permissionShare',
					checked: r,
				},
				{
					xtype: 'checkbox',
					fieldLabel: _('Change'),
					name: 'permissionChange',
					ref: '../permissionChange',
					checked: a,
				},
			];
			if (this.store.fileType === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				n.push(
					{
						xtype: 'checkbox',
						fieldLabel: _('Create'),
						name: 'permissionCreate',
						ref: '../permissionCreate',
						checked: i,
					},
					{
						xtype: 'checkbox',
						fieldLabel: _('Delete'),
						name: 'permissionDelete',
						ref: '../permissionDelete',
						checked: s,
					},
				);
			}
			return [
				{
					xtype: 'filesplugin.seafile.usergrouppredictorfield',
					fieldLabel: _('Share with'),
					name: 'shareWith',
					ref: 'shareWith',
					allowBlank: false,
					value: t,
					recordId: this.recordId,
				},
				{
					xtype: 'selectbox',
					fieldLabel: _('Type'),
					name: 'type',
					ref: 'type',
					allowBlank: false,
					value: e,
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
					items: n,
				},
			];
		},
	},
);
Ext.reg(
	'filesplugin.seafile.filesshareusereditpanel',
	Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserEditPanel,
);
