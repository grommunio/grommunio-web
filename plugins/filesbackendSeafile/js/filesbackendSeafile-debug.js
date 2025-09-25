Ext.namespace('Zarafa.plugins.files.backend.Seafile');

/**
 * Entry point used to register the Seafile backend with the Files plugin.
 * Mirrors the approach taken by the other bundled backends so the plugin
 * manager can construct all required UI components on demand.
 *
 * @class Zarafa.plugins.files.backend.Seafile.SeafileBackend
 * @extends Zarafa.core.Plugin
 */
Zarafa.plugins.files.backend.Seafile.SeafileBackend = Ext.extend(
	Zarafa.core.Plugin,
	{
		/**
		 * Initialise the plugin with sane defaults and register for upcoming hooks.
		 *
		 * @param {Object} config Optional configuration object provided by the container.
		 */
		constructor: function (config) {
			config = config || {};
			Zarafa.plugins.files.backend.Seafile.SeafileBackend.superclass.constructor.call(
				this,
				config,
			);
		},

		/**
		 * Register all Ext insertion points and shared components consumed by this backend.
		 */
		initPlugin: function () {
			Zarafa.plugins.files.backend.Seafile.SeafileBackend.superclass.initPlugin.apply(
				this,
				arguments,
			);
			this.registerInsertionPoint(
				'plugin.files.sharedialog',
				this.createShareDialogInsertionPoint,
				this,
			);
			Zarafa.core.data.SharedComponentType.addProperty(
				'filesplugin.seafile.useredit',
			);
		},

		/**
		 * Provide the configuration used to render the share dialog when requested by the Files module.
		 *
		 * @return {{xtype: string}}
		 */
		createShareDialogInsertionPoint: function () {
			return {
				xtype: 'filesplugin.seafile.filessharedialogpanel',
			};
		},

		/**
		 * Binds component requests to the Seafile specific user edit panel.
		 *
		 * @param {Number} componentType Component type requested by the container.
		 * @return {Number}
		 */
		bidSharedComponent: function (componentType) {
			var i = -1;
			switch (componentType) {
				case Zarafa.core.data.SharedComponentType[
					'filesplugin.seafile.useredit'
				]:
					i = 1;
			}
			return i;
		},

		/**
		 * Returns the concrete implementation for Seafile specific shared components.
		 *
		 * @param {Number} componentType Component type requested by the container.
		 * @return {Function|undefined}
		 */
		getSharedComponent: function (componentType) {
			var i;
			switch (componentType) {
				case Zarafa.core.data.SharedComponentType[
					'filesplugin.seafile.useredit'
				]:
					i =
						Zarafa.plugins.files.backend.Seafile.ui
							.FilesShareUserEditContentPanel;
			}
			return i;
		},
	},
);
Zarafa.onReady(function () {
	container.registerPlugin(
		new Zarafa.core.PluginMetaData({
			name: 'filesbackendSeafile',
			displayName: _('Files: Seafile Backend'),
			allowUserDisable: false,
			pluginConstructor: Zarafa.plugins.files.backend.Seafile.SeafileBackend,
		}),
	);
});
Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Dialog that exposes Seafile specific sharing capabilities to the Files plugin.
 * It mirrors the structure of the ownCloud backend dialog so that translations
 * and widget bindings stay familiar to administrators.
 *
 * @class Zarafa.plugins.files.backend.Seafile.ui.FilesShareDialogPanel
 * @extends Zarafa.plugins.files.ui.dialogs.SharePanel
 */
Zarafa.plugins.files.backend.Seafile.ui.FilesShareDialogPanel = Ext.extend(
	Zarafa.plugins.files.ui.dialogs.SharePanel,
	{
		loadMask: undefined,
		passwordChanged: false,
		expirationDateChanged: false,
		pubUploadChanged: false,
		linkShareID: -1,
		recordId: undefined,
		parentRecord: undefined,
		/**
		 * Prepare the dialog by resolving the selected record and wiring the store.
		 *
		 * @param {Object} config Configuration passed in by the Files plugin container.
		 */
		constructor: function (config) {
			config = config || {};
			var ownerRecord = config.ownerCt.records[0];
			var recordType = ownerRecord.get('type');
			this.recordId = Ext.isDefined(ownerRecord.get('folder_id'))
				? ownerRecord.get('folder_id')
				: ownerRecord.get('id');
			this.parentRecord = ownerRecord;
			Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore.init(
				recordType,
			);
			this.setupGridStoreListeners();
			Ext.applyIf(config, {
				height: 450,
				width: 780,
				items: [
					{
						xtype: 'fieldset',
						title: _('Share with user/group'),
						autoHeight: true,
						ref: 'userfieldset',
						items: [
							{
								xtype: 'filesplugin.seafile.filesshareusergrid',
								ref: '../usergrid',
								height: 200,
								recordId: this.recordId,
							},
						],
					},
					{
						xtype: 'checkbox',
						fieldLabel: '',
						boxLabel: _('Share via link'),
						ref: 'linkcheckbox',
						inputValue: 'sharelink',
						style: {
							marginTop: '5px',
							marginLeft: '6px',
						},
						listeners: {
							check: this.onShareViaLinkChecked,
							scope: this,
						},
					},
					{
						xtype: 'fieldset',
						title: _('Share via link'),
						autoHeight: true,
						ref: 'linkfieldset',
						hidden: true,
						items: [
							{
								layout: 'column',
								border: false,
								defaults: {
									border: false,
								},
								anchor: '0',
								items: [
									{
										columnWidth: 0.95,
										layout: 'form',
										items: {
											xtype: 'textfield',
											fieldLabel: _('Public link'),
											ref: '../../../linkfield',
											anchor: '100%',
											selectOnFocus: true,
											readOnly: true,
										},
									},
									{
										columnWidth: 0.05,
										items: {
											xtype: 'button',
											iconCls: 'icon_copy_clipboard',
											tooltip: _('Copy link to clipboard'),
											handler: this.copyPublicLinkToClipboard,
											scope: this,
										},
									},
								],
							},
							{
								xtype: 'checkbox',
								fieldLabel: _('Password protect'),
								boxLabel: '',
								ref: '../passwordcheckbox',
								inputValue: 'pwprotected',
								listeners: {
									check: this.onUsePasswordChecked,
									scope: this,
								},
							},
							{
								xtype: 'textfield',
								fieldLabel: _('Password'),
								ref: '../passwordfield',
								hidden: true,
								inputType: 'password',
								name: 'textvalue',
								listeners: {
									change: this.onPasswordChange,
									keyup: this.onPasswordChange,
									scope: this,
								},
							},
							{
								xtype: 'checkbox',
								fieldLabel: _('Public upload'),
								boxLabel: '',
								hidden: true,
								ref: '../editcheckbox',
								inputValue: 'allowediting',
								listeners: {
									check: this.onAllowEditingChecked,
									scope: this,
								},
							},
							{
								xtype: 'checkbox',
								fieldLabel: _('Expiration date'),
								boxLabel: '',
								ref: '../expirationcheckbox',
								inputValue: 'useexpiration',
								listeners: {
									check: this.onUseExpirationDateChecked,
									scope: this,
								},
							},
							{
								xtype: 'datefield',
								ref: '../expirationfield',
								hidden: true,
								fieldLabel: _('Date'),
								minValue: new Date(new Date().getTime() + 86400000),
								width: 170,
								format: 'Y-m-d',
								listeners: {
									change: this.onExpirationDateChange,
									keyup: this.onExpirationDateChange,
									scope: this,
								},
							},
						],
					},
				],
				buttons: [
					{
						xtype: 'button',
						text: _('Ok'),
						handler: this.onDoneButtonClick,
						ref: '../doneButton',
						scope: this,
					},
					{
						xtype: 'button',
						text: _('Cancel'),
						handler: this.onCancel,
						scope: this,
					},
				],
				listeners: {
					afterrender: this.checkSharedRecord,
					scope: this,
				},
			});
			Zarafa.plugins.files.backend.Seafile.ui.FilesShareDialogPanel.superclass.constructor.call(
				this,
				config,
			);
		},
		/**
		 * Subscribe to store events so UI reacts to server-side changes.
		 */
		setupGridStoreListeners: function () {
			var store =
				Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore.getStore();
			store.on('add', this.onGridStoreAdd, this);
			store.on('update', this.onGridStoreUpdate, this);
			store.on('remove', this.onGridStoreRemove, this);
		},
		/**
		 * Remove shares from Seafile once they disappear from the grid.
		 */
		onGridStoreRemove: function (store, record) {
			if (record.get('id') !== '' && record.get('id') !== -1) {
				this.removeShareByID(record.get('id'));
			}
		},
		/**
		 * Keep remote permissions aligned with inline edits in the grid.
		 */
		onGridStoreUpdate: function (store, record) {
			this.updateExistingShare(record);
		},
		/**
		 * Trigger share creation for freshly added recipients.
		 */
		onGridStoreAdd: function (store, records) {
			if (records.length !== 1 || records[0].get('id') !== -1) {
				return true;
			}
			this.createShare(records[0], store, false);
		},
		/**
		 * Toggle link sharing UI and instruct the backend accordingly.
		 */
		onShareViaLinkChecked: function (e, t) {
			if (t) {
				this.linkfieldset.show();
				this.createShareByLink();
			} else {
				this.linkfieldset.hide();
				this.removeShareByID(this.linkShareID);
				this.linkShareID = -1;
			}
		},
		/**
		 * Show or hide the password field attached to public links.
		 */
		onUsePasswordChecked: function (e, t) {
			if (t) {
				this.passwordfield.show();
			} else {
				this.passwordfield.hide();
			}
		},
		/**
		 * Track manual password edits so we can update the backend only once.
		 */
		onPasswordChange: function (e, t) {
			this.passwordChanged = true;
		},
		/**
		 * Show or hide the upload area depending on whether editing is allowed.
		 */
		onAllowEditingChecked: function (e, t) {
			this.pubUploadChanged = true;
		},
		/**
		 * Toggle the expiration date input for link shares.
		 */
		onUseExpirationDateChecked: function (e, t) {
			if (t) {
				this.expirationfield.show();
			} else {
				this.expirationfield.hide();
			}
		},
		/**
		 * Flag the expiration date field so we know to persist the change.
		 */
		onExpirationDateChange: function () {
			this.expirationDateChanged = true;
		},
		/**
		 * Close the dialog without persisting additional changes.
		 */
		onCancel: function () {
			this.dialog.close();
		},
		/**
		 * Expose the current public sharing URL.
		 */
		getPublicLinkValue: function () {
			return this.linkfield.getValue();
		},
		/**
		 * Copy the public link to the clipboard using modern browser APIs.
		 */
		copyPublicLinkToClipboard: function () {
			var linkValue = this.getPublicLinkValue();
			if (Ext.isEmpty(linkValue)) {
				return;
			}
			if (linkValue && linkValue.replace) {
				linkValue = linkValue.replace(/^\s+|\s+$/g, '');
			}
			var onSuccess = function () {
				container
					.getNotifier()
					.notify(
						'info.files',
						'',
						_('Link copied to clipboard'),
					);
			};
			var onFailure = function () {
				container
					.getNotifier()
					.notify(
						'error',
						_('Clipboard'),
						_('Could not copy link automatically. Please copy it manually.'),
					);
			};
			if (
				navigator.clipboard &&
				Ext.isFunction(navigator.clipboard.writeText)
			) {
				navigator.clipboard.writeText(linkValue).then(onSuccess, onFailure);
				return;
			}
			var textarea = document.createElement('textarea');
			textarea.value = linkValue;
			textarea.setAttribute('readonly', 'readonly');
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			textarea.setSelectionRange(0, textarea.value.length);
			try {
				var succeeded = document.execCommand('copy');
				document.body.removeChild(textarea);
				succeeded ? onSuccess() : onFailure();
			} catch (error) {
				document.body.removeChild(textarea);
				onFailure();
			}
		},
		/**
		 * Detach listeners and close the dialog window.
		 */
		closeDialog: function () {
			var e =
				Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore.getStore();
			e.un('update', this.onGridStoreUpdate, this);
			e.un('remove', this.onGridStoreRemove, this);
			this.dialog.close();
		},
		/**
		 * Hide the loading mask if it is currently visible.
		 */
		closeLoadMask: function () {
			this.loadMask.hide();
		},
		/**
		 * Validate pending changes and close the dialog when finished.
		 */
		onDoneButtonClick: function () {
			if (this.linkcheckbox.getValue()) {
				this.updateExistingShare();
			} else {
				this.closeDialog();
			}
		},
		/**
		 * Fetch existing sharing metadata for the selected record if needed.
		 */
		checkSharedRecord: function () {
			this.loadMask = new Ext.LoadMask(this.getEl(), {
				msg: _('Loading details...'),
			});
			if (Ext.isDefined(this.parentRecord)) {
				if (
					this.parentRecord.get('type') ===
					Zarafa.plugins.files.data.FileTypes.FOLDER
				) {
					this.editcheckbox.show();
				}
				if (this.parentRecord.get('isshared') === true) {
					this.initSharedRecord();
				}
			}
		},
		/**
		 * Request sharing details from the server to prefill the dialog.
		 */
		initSharedRecord: function () {
			this.loadMask.show();
			var e = [this.recordId];
			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'loadsharingdetails',
				{
					records: e,
				},
				new Zarafa.plugins.files.backend.Seafile.data.ResponseHandler({
					successCallback: this.initGuiFromSharedRecord.createDelegate(this),
				}),
			);
		},
		/**
		 * Populate the dialog after loading existing share metadata.
		 */
		initGuiFromSharedRecord: function (e) {
			var t = e.shares[this.recordId];
			for (var i in t) {
				var a = t[i];
				if (
					a.shareType ===
					Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.LINK
				) {
					this.linkShareID = i;
					this.linkfieldset.show();
					this.linkcheckbox.suspendEvents(false);
					this.linkcheckbox.setValue(true);
					this.linkcheckbox.resumeEvents();
					this.linkfield.setValue(a.url);
					if (!Ext.isEmpty(a.expiration)) {
						this.expirationcheckbox.setValue(true);
						var s = new Date(a.expiration);
						this.expirationfield.setValue(s);
					}
					if (!Ext.isEmpty(a.shareWith)) {
						this.passwordcheckbox.setValue(true);
						this.passwordfield.setValue('******');
					}
					if (!Ext.isEmpty(a.permissions)) {
						if (parseInt(a.permissions, 10) === 7) {
							this.editcheckbox.suspendEvents(false);
							this.editcheckbox.setValue(true);
							this.editcheckbox.resumeEvents();
						}
					}
				} else if (
					a.shareType ===
					Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.GROUP
				) {
					Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore.addGroup(
						a,
					);
				} else {
					Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore.addUser(
						a,
					);
				}
				this.doneButton.setDisabled(false);
			}
			this.loadMask.hide();
		},
		/**
		 * Request a new public link or update the existing one.
		 */
		createShareByLink: function () {
			this.loadMask.show();
			var e = [this.recordId];
			var t = {
				shareType:
					Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.LINK,
			};
			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'createnewshare',
				{
					records: e,
					options: t,
				},
				new Zarafa.plugins.files.backend.Seafile.data.ResponseHandler({
					successCallback: this.shareByLinkCreated.createDelegate(this),
					failureCallback: this.closeDialog.createDelegate(this),
				}),
			);
		},
		/**
		 * Handle the response after a public link was created.
		 */
		shareByLinkCreated: function (e) {
			var t = e.shares[this.recordId.replace(/\/+$/g, '')];
			this.linkfield.setValue(t.url);
			this.linkShareID = t.id;
			var i = this.parentRecord.get('sharedid') || [];
			i.push(t.id);
			this.parentRecord.set('sharedid', i);
			this.parentRecord.set('isshared', true);
			this.doneButton.setDisabled(false);
			this.loadMask.hide();
		},
		/**
		 * Remove a share by identifier and refresh the grid.
		 */
		removeShareByID: function (e) {
			this.loadMask.show();
			var t = this.parentRecord.getAccount().get('id');
			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'deleteexistingshare',
				{
					records: [e],
					accountid: t,
				},
				new Zarafa.plugins.files.backend.Seafile.data.ResponseHandler({
					successCallback: this.shareByIDRemoved.createDelegate(
						this,
						[e],
						true,
					),
					failureCallback: this.closeDialog.createDelegate(this),
				}),
			);
		},
		/**
		 * Update local state after a share has been deleted.
		 */
		shareByIDRemoved: function (e, t) {
			var i = this.parentRecord.get('sharedid') || [];
			var a = i.indexOf(t);
			if (a > -1) {
				i.splice(a, 1);
			}
			this.parentRecord.set('sharedid', i);
			if (i.length == 0) {
				this.parentRecord.set('isshared', false);
			}
			this.loadMask.hide();
		},
		/**
		 * Create a new share for the provided recipient.
		 */
		createShare: function (e, t) {
			this.loadMask.show();
			var i = [this.recordId];
			var a = this.getPermissions(e);
			var s = {
				shareType:
					e.get('type') === 'user'
						? Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.USER
						: Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.GROUP,
				shareWith: e.get('shareWith'),
				permissions: a,
				shareWithDisplayname: e.get('shareWithDisplayname'),
			};
			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'createnewshare',
				{
					records: i,
					options: s,
				},
				new Zarafa.plugins.files.backend.Seafile.data.ResponseHandler({
					successCallback: this.shareCreated.createDelegate(this, [s, e], true),
					failureCallback: this.shareFailed.createDelegate(this, [t, e]),
				}),
			);
		},
		/**
		 * Update the UI after a share was created successfully.
		 */
		shareCreated: function (e, t, i) {
			var a = e.shares[this.recordId.replace(/\/+$/g, '')];
			var s = this.parentRecord.get('sharedid') || [];
			s.push(a.id);
			i.data.id = a.id;
			this.parentRecord.set('sharedid', s);
			this.parentRecord.set('isshared', true);
			t.id = a.id;
			this.loadMask.hide();
		},
		/**
		 * Roll back grid changes if the share request fails.
		 */
		shareFailed: function (e, t) {
			e.remove(t);
			this.loadMask.hide();
		},
		/**
		 * Update the currently selected share with the latest form values.
		 */
		updateExistingShare: function (e) {
			this.loadMask.show();
			var t = {};
			var i = [];
			if (Ext.isDefined(e)) {
				t.permissions = this.getPermissions(e);
				i.push(e.get('id'));
			} else {
				if (this.passwordChanged) {
					t.password = this.passwordfield.getValue();
				}
				if (!this.passwordcheckbox.getValue()) {
					t.password = '';
				}
				if (this.pubUploadChanged) {
					if (this.editcheckbox.getValue()) {
						t.permissions = 7;
					} else {
						t.permissions = 1;
					}
				}
				if (this.expirationDateChanged) {
					t.expireDate = this.expirationfield.getRawValue();
				}
				if (!this.expirationcheckbox.getValue()) {
					t.expireDate = '';
				}
				i.push(this.linkShareID);
			}
			container.getRequest().singleRequest(
				'filesbrowsermodule',
				'updateexistingshare',
				{
					records: i,
					accountid: this.parentRecord.getAccount().get('id'),
					options: t,
				},
				new Zarafa.plugins.files.backend.Seafile.data.ResponseHandler({
					successCallback: this.shareByLinkUpdated.createDelegate(this, [e]),
					failureCallback: this.closeLoadMask.createDelegate(this),
				}),
			);
		},
		/**
		 * Apply returned values to the UI after updating a public link.
		 */
		shareByLinkUpdated: function (e) {
			this.loadMask.hide();
			if (!Ext.isDefined(e)) {
				this.closeDialog();
			}
		},
		/**
		 * Translate checkbox state into the expected permissions bitmask.
		 */
		getPermissions: function (e) {
			var t = 1;
			if (e.get('permissionChange')) {
				t += 2;
			}
			if (e.get('permissionCreate')) {
				t += 4;
			}
			if (e.get('permissionDelete')) {
				t += 8;
			}
			if (e.get('permissionShare')) {
				t += 16;
			}
			return t;
		},
	},
);
Ext.reg(
	'filesplugin.seafile.filessharedialogpanel',
	Zarafa.plugins.files.backend.Seafile.ui.FilesShareDialogPanel,
);
Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Lightweight content panel that hosts the Seafile share editor grid.
 */
Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserEditContentPanel =
	Ext.extend(Zarafa.core.ui.ContentPanel, {
		loadMask: undefined,
		constructor: function (e) {
			Ext.applyIf(e, {
				layout: 'fit',
				title: _('Share Details'),
				closeOnSave: true,
				model: true,
				autoSave: false,
				width: 480,
				height: 445,
				items: {
					xtype: 'filesplugin.seafile.filesshareusereditpanel',
					record: e.record,
					store: e.store,
					recordId: e.recordId,
				},
			});
			Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserEditContentPanel.superclass.constructor.call(
				this,
				e,
			);
		},
	});
Ext.reg(
	'filesplugin.seafile.filesshareusereditcontentpanel',
	Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserEditContentPanel,
);
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
Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Grid that displays all Seafile share recipients for the selected record.
 */
Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGrid = Ext.extend(
	Ext.grid.GridPanel,
	{
		store: undefined,
		recordId: undefined,
		constructor: function (e) {
			e = e || {};
			this.store =
				Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore.getStore();
			Ext.applyIf(e, {
				xtype: 'filesplugin.seafile.filesshareusergrid',
				ref: 'sharegrid',
				store: this.store,
				border: false,
				baseCls: 'shareGrid',
				enableHdMenu: false,
				loadMask: this.initLoadMask(),
				viewConfig: this.initViewConfig(),
				sm: this.initSelectionModel(),
				cm: this.initColumnModel(),
				listeners: {
					rowdblclick: this.onRowDblClick,
					scope: this,
				},
				tbar: [
					{
						iconCls: 'filesplugin_icon_add',
						text: _('Add'),
						handler: this.onAdd.createDelegate(this),
					},
					'-',
					{
						iconCls: 'filesplugin_icon_delete',
						text: _('Delete'),
						ref: '../removeAccountBtn',
						disabled: true,
						handler: this.onDelete.createDelegate(this),
					},
				],
			});
			Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGrid.superclass.constructor.call(
				this,
				e,
			);
		},
		initLoadMask: function () {
			return {
				msg:
					_('Loading users and groups') +
					'...',
			};
		},
		initViewConfig: function () {
			return {
				enableRowBody: false,
				forceFit: true,
				emptyText:
					"<div class='emptytext'>" +
					_('Add users or groups to share files.') +
					'</div>',
				deferEmptyText: false,
			};
		},
		initSelectionModel: function () {
			return new Ext.grid.RowSelectionModel({
				singleSelect: true,
				listeners: {
					selectionchange: this.onRowSelected,
				},
			});
		},
		initColumnModel: function () {
			return new Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGridColumnModel(
				{
					fileType: this.store.fileType,
				},
			);
		},
		onRowSelected: function (e) {
			this.grid.removeAccountBtn.setDisabled(e.getCount() != 1);
		},
		onRowDblClick: function (e, t) {
			Zarafa.core.data.UIFactory.openLayerComponent(
				Zarafa.core.data.SharedComponentType['filesplugin.seafile.useredit'],
				undefined,
				{
					store: e.getStore(),
					record: e.getStore().getAt(t),
					manager: Ext.WindowMgr,
					recordId: this.recordId,
				},
			);
		},
		onAdd: function (e, t) {
			Zarafa.core.data.UIFactory.openLayerComponent(
				Zarafa.core.data.SharedComponentType['filesplugin.seafile.useredit'],
				undefined,
				{
					store: this.store,
					manager: Ext.WindowMgr,
					recordId: this.recordId,
				},
			);
		},
		onDelete: function (e, t) {
			var i = this.getSelectionModel().getSelected();
			if (!i) {
				return false;
			}
			this.store.remove(i);
		},
	},
);
Ext.reg(
	'filesplugin.seafile.filesshareusergrid',
	Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGrid,
);
Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Column model that mirrors the permissions matrix used by the ownCloud backend.
 */
Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGridColumnModel =
	Ext.extend(Zarafa.common.ui.grid.ColumnModel, {
		constructor: function (e) {
			e = e || {};
			this.defaultColumns = this.createDefaultColumns(e.fileType);
			Ext.applyIf(e, {
				columns: this.defaultColumns,
				defaults: {
					sortable: true,
				},
			});
			Ext.apply(this, e);
			Zarafa.plugins.files.backend.Seafile.ui.FilesShareUserGridColumnModel.superclass.constructor.call(
				this,
				e,
			);
		},
		createDefaultColumns: function (e) {
			var t = [
				{
					header: _('Name'),
					dataIndex: 'shareWithDisplayname',
					flex: 1,
					sortable: true,
					tooltip: _('Sort by: Name'),
				},
				{
					header: _('Type'),
					dataIndex: 'type',
					flex: 1,
					align: 'center',
					sortable: true,
					renderer: this.shareTypeRenderer,
					tooltip: _('Sort by: Type'),
				},
				{
					header: _('Share'),
					dataIndex: 'permissionShare',
					flex: 1,
					align: 'center',
					sortable: false,
					renderer: this.yesNoRenderer,
				},
				{
					header: _('Change'),
					dataIndex: 'permissionChange',
					flex: 1,
					align: 'center',
					sortable: false,
					renderer: this.yesNoRenderer,
				},
			];
			if (e === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				t.push(
					{
						header: _('Create'),
						dataIndex: 'permissionCreate',
						flex: 1,
						align: 'center',
						sortable: false,
						renderer: this.yesNoRenderer,
					},
					{
						header: _('Delete'),
						dataIndex: 'permissionDelete',
						flex: 1,
						align: 'center',
						sortable: false,
						renderer: this.yesNoRenderer,
					},
				);
			}
			return t;
		},
		shareTypeRenderer: function (e, t, i) {
			t.css = 'shareicon_16_' + e;
			t.css += ' zarafa-grid-empty-cell';
			return '';
		},
		yesNoRenderer: function (e, t, i) {
			t.css = e ? 'shareicon_16_yes' : 'shareicon_16_no';
			t.css += ' zarafa-grid-empty-cell';
			return '';
		},
	});
Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');
Ext.namespace('Zarafa.plugins.files.backend.Seafile.ui');

/**
 * Auto-complete combo box that offers user and group recipients from Seafile.
 */
Zarafa.plugins.files.backend.Seafile.ui.UserGroupPredictorField = Ext.extend(
	Ext.form.ComboBox,
	{
		constructor: function (e) {
			var t = new Ext.data.ArrayStore({
				proxy: new Ext.data.HttpProxy({
					method: 'GET',
					url: container.getBasePath() + 'index.php',
				}),
				method: 'GET',
				baseParams: {
					load: 'custom',
					name: 'files_get_recipients',
					id: e.recordId,
				},
				id: 1,
				fields: ['display_name', 'shareWith', 'object_type'],
			});
			e = e || {};
			Ext.applyIf(e, {
				store: t,
				displayField: 'display_name',
				typeAhead: false,
				forceSelection: true,
				triggerAction: 'query',
				itemId: 'predictor',
				mode: 'remote',
				minChars: 2,
				emptyText: _('Type to search'),
				loadingText: _('Loading...'),
				listEmptyText: _('No results'),
				itemSelector: 'div.ugpredic_search_item',
				tpl: new Ext.XTemplate(
					'<tpl for=".">',
					'<div class="ugpredic_search_item">',
					'<h3>',
					'<tpl if="object_type == Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.USER"><span><div class="shareicon_16_user">&nbsp;</div></span></tpl>',
					'<tpl if="object_type == Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.GROUP"><span><div class="shareicon_16_group">&nbsp;</div></span></tpl>',
					'{display_name:htmlEncode}',
					'</h3>',
					'</div>',
					'</tpl>',
					'</tpl>',
				),
				onSelect: this.onSuggestionSelect,
				listeners: {
					invalid: this.onInvalid,
					scope: this,
				},
			});
			Zarafa.plugins.files.backend.Seafile.ui.UserGroupPredictorField.superclass.constructor.call(
				this,
				e,
			);
		},
		onSuggestionSelect: function (e) {
			this.setRawValue(e.get('display_name'));
			this.ownerCt.type.setValue(
				e.get('object_type') ==
					Zarafa.plugins.files.backend.Seafile.data.RecipientTypes.USER
					? 'user'
					: 'group',
			);
			this.collapse();
		},
		onInvalid: function () {
			if (this.isExpanded()) {
				this.store.removeAll();
				this.collapse();
			}
		},
	},
);
Ext.reg(
	'filesplugin.seafile.usergrouppredictorfield',
	Zarafa.plugins.files.backend.Seafile.ui.UserGroupPredictorField,
);
Ext.namespace('Zarafa.plugins.files.backend.Seafile.data');

/**
 * Enum that lists the supported target types for Seafile sharing.
 */
Zarafa.plugins.files.backend.Seafile.data.RecipientTypes =
	Zarafa.core.Enum.create({
		USER: 0,
		GROUP: 1,
		LINK: 3,
	});
Ext.namespace('Zarafa.plugins.files.backend.Seafile.data');

/**
 * Thin wrapper around the generic response handler to reuse Seafile specific callbacks.
 */
Zarafa.plugins.files.backend.Seafile.data.ResponseHandler = Ext.extend(
	Zarafa.core.data.AbstractResponseHandler,
	{
		successCallback: null,
		failureCallback: null,
		doLoadsharingdetails: function (e) {
			this.successCallback(e);
		},
		doCreatenewshare: function (e) {
			this.successCallback(e);
		},
		doDeleteexistingshare: function (e) {
			this.successCallback(e);
		},
		doUpdateexistingshare: function (e) {
			this.successCallback(e);
		},
		doError: function (e) {
			Zarafa.common.dialogs.MessageBox.show({
				title: e.header,
				msg: e.message,
				icon: Zarafa.common.dialogs.MessageBox.ERROR,
				buttons: Zarafa.common.dialogs.MessageBox.OK,
			});
			this.failureCallback(e);
		},
	},
);
Ext.reg(
	'filesplugin.seafile.responsehandler',
	Zarafa.plugins.files.backend.Seafile.data.ResponseHandler,
);
Ext.namespace('Zarafa.plugins.files.backend.Seafile.data');

/**
 * Record definition representing a single share recipient entry.
 */
Zarafa.plugins.files.backend.Seafile.data.ShareGridRecord =
	Ext.data.Record.create(
		{
			name: 'id',
			type: 'string',
		},
		{
			name: 'shareWith',
			type: 'string',
		},
		{
			name: 'shareWithDisplayname',
			type: 'string',
		},
		{
			name: 'type',
			type: 'string',
		},
		{
			name: 'permissionCreate',
			type: 'bool',
		},
		{
			name: 'permissionChange',
			type: 'bool',
		},
		{
			name: 'permissionDelete',
			type: 'bool',
		},
		{
			name: 'permissionShare',
			type: 'bool',
		},
	);
Ext.namespace('Zarafa.plugins.files.backend.Seafile.data');

/**
 * Lightweight array store that backs the share grid with in-memory data.
 */
Zarafa.plugins.files.backend.Seafile.data.ShareGridStore = Ext.extend(
	Ext.data.ArrayStore,
	{
		constructor: function (e) {
			Zarafa.plugins.files.backend.Seafile.data.ShareGridStore.superclass.constructor.call(
				this,
				{
					fields: [
						'id',
						'shareWith',
						'shareWithDisplayname',
						'type',
						'permissionCreate',
						'permissionChange',
						'permissionDelete',
						'permissionShare',
					],
					fileType: e,
				},
			);
		},
	},
);
Ext.reg(
	'filesplugin.seafile.sharegridstore',
	Zarafa.plugins.files.backend.Seafile.data.ShareGridStore,
);
Ext.namespace('Zarafa.plugins.files.backend.Seafile.data.singleton');

/**
 * Singleton wrapper around the share grid store so multiple widgets can share it.
 */
Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore = Ext.extend(
	Object,
	{
		store: undefined,
		init: function (e) {
			this.store = new Zarafa.plugins.files.backend.Seafile.data.ShareGridStore(
				e,
			);
		},
		addUser: function (e) {
			var t = false;
			var i = false;
			var a = false;
			var s = false;
			if (e.permissions - 16 >= 1) {
				s = true;
				e.permissions -= 16;
			}
			if (e.permissions - 8 >= 1) {
				a = true;
				e.permissions -= 8;
			}
			if (e.permissions - 4 >= 1) {
				t = true;
				e.permissions -= 4;
			}
			if (e.permissions - 2 >= 1) {
				i = true;
			}
			var r = [e.id, e.shareWith, e.shareWithDisplayname, 'user', t, i, a, s];
			this.store.loadData([r], true);
		},
		addGroup: function (e) {
			var t = false;
			var i = false;
			var a = false;
			var s = false;
			if (e.permissions - 16 >= 1) {
				s = true;
				e.permissions -= 16;
			}
			if (e.permissions - 8 >= 1) {
				a = true;
				e.permissions -= 8;
			}
			if (e.permissions - 4 >= 1) {
				t = true;
				e.permissions -= 4;
			}
			if (e.permissions - 2 >= 1) {
				i = true;
			}
			var r = [e.id, e.shareWith, e.shareWithDisplayname, 'group', t, i, a, s];
			this.store.loadData([r], true);
		},
		getStore: function () {
			return this.store;
		},
	},
);
Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore =
	new Zarafa.plugins.files.backend.Seafile.data.singleton.ShareStore();
