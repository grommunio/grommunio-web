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
