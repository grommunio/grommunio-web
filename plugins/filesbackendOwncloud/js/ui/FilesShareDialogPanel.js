Ext.namespace('Zarafa.plugins.files.backend.Owncloud.ui');

/**
 * @class Zarafa.plugins.files.backend.Owncloud.ui.FilesShareDialogPanel
 * @extends Zarafa.plugins.files.ui.dialogs.SharePanel
 * @xtype filesplugin.owncloud.filessharedialogpanel
 *
 * The panel contains all logic and UI elements that are needed for the OCS sharing functionality.
 */
Zarafa.plugins.files.backend.Owncloud.ui.FilesShareDialogPanel = Ext.extend(Zarafa.plugins.files.ui.dialogs.SharePanel, {
	/**
	 * The loading mask of this panel
	 * @property
	 * @type Ext.LoadMask
	 */
	loadMask: undefined,

	/**
	 * Flag for the password field
	 * @property
	 * @type bool
	 */
	passwordChanged: false,

	/**
	 * Flag for the date field
	 * @property
	 * @type bool
	 */
	expirationDateChanged: false,

	/**
	 * Flag for the edit checkbox
	 * @property
	 * @type bool
	 */
	pubUploadChanged: false,

	/**
	 * The id of the linkshare, -1 if no linkshare is set
	 * @property
	 * @type Number
	 */
	linkShareID: -1,

	/**
	 * Id of the files record
	 * @property
	 * @type Number
	 */
	recordId: undefined,

	/**
	 * Parent files record
	 * @property
	 * @type {Ext.record}
	 */
	parentRecord: undefined,

	/**
	 * Constructor - init store and UI
	 *
	 * @constructor
	 * @param {Object} config the configuration for this panel
	 */
	constructor: function (config) {
		config = config || {};
		var type = config.ownerCt.records[0].get("type");
		this.recordId = config.ownerCt.records[0].get("folder_id");
		this.parentRecord = config.ownerCt.records[0];
		var shares = this.parentRecord.get('sharedid');
		Zarafa.plugins.files.backend.Owncloud.data.singleton.ShareStore.init(type);
		this.setupGridStoreListeners();


		Ext.applyIf(config, {
			listeners: {
				afterrender: this.checkSharedRecord
			},
			height   : 450,
			width    : 780,
			items    : [{
				xtype     : "fieldset",
				title     : _("Share with user/group"),
				autoHeight: true,
				ref       : "userfieldset",
				items     : [{
					xtype : "filesplugin.owncloud.filesshareusergrid",
					ref   : "../usergrid",
					height: 200,
					recordId: this.recordId
				}]
			}, {
				xtype     : "checkbox",
				fieldLabel: "",
				boxLabel  : _("Share via link"),
				ref       : "linkcheckbox",
				inputValue: "sharelink",
				style: {
					marginTop: '5px',
					marginLeft: '6px'
				},
				listeners : {
					check: this.onShareViaLinkChecked.createDelegate(this)
				}
			}, {
				xtype     : "fieldset",
				title     : _("Share via link"),
				autoHeight: true,
				ref       : "linkfieldset",
				hidden    : true,
				items     : [{
					layout  : "column",
					border  : false,
					defaults: {
						border: false
					},
					anchor  : "0",
					items   : [{
						columnWidth: .95,
						layout     : "form",
						items      : {
							xtype        : "textfield",
							fieldLabel   : _("Public link"),
							ref          : "../../../linkfield",
							anchor       : '100%',
							selectOnFocus: true,
							readOnly     : true
						}
					}, {
						columnWidth: .05,
						items      : {
							xtype       : "button",
							iconCls     : "icon_copy_clipboard",
							handler     : this.onCopyUrl,
							scope       : this
						}
					}]
				}, {
					xtype     : "checkbox",
					fieldLabel: _("Password protect"),
					boxLabel  : "",
					ref       : "../passwordcheckbox",
					inputValue: "pwprotected",
					listeners : {
						check: this.onUsePasswordChecked.createDelegate(this)
					}
				}, {
					xtype     : "textfield",
					fieldLabel: _("Password"),
					ref       : "../passwordfield",
					hidden    : true,
					inputType : 'password',
					name      : "textvalue",
					listeners : {
						change: this.onPasswordChange.createDelegate(this),
						keyup : this.onPasswordChange.createDelegate(this)
					}
				}, {
					xtype     : "checkbox",
					fieldLabel: _("Public upload"),
					boxLabel  : "",
					hidden    : true,
					ref       : "../editcheckbox",
					inputValue: "allowediting",
					listeners : {
						check: this.onAllowEditingChecked.createDelegate(this)
					}
				}, {
					xtype     : "checkbox",
					fieldLabel: _("Expiration date"),
					boxLabel  : "",
					ref       : "../expirationcheckbox",
					inputValue: "useexpiration",
					listeners : {
						check: this.onUseExpirationDateChecked.createDelegate(this)
					}
				}, {
					xtype     : "datefield",
					ref       : "../expirationfield",
					hidden    : true,
					fieldLabel: _("Date"),
					minValue  : new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // tomorrow
					width     : 170,
					format    : 'Y-m-d',
					listeners : {
						change: this.onExpirationDateChange.createDelegate(this),
						keyup : this.onExpirationDateChange.createDelegate(this)
					}
				}]
			}, {
				xtype: 'label',
				text: _('More than 1 share link exists. Only showing the latest one'),
				hidden : (shares || []).length < 2,
				width: '100%',
				autoWidth: true
			}],
			buttons  : [{
				xtype  : 'button',
				text   : _('Ok'),
				handler: this.onDoneButtonClick,
				ref     : "../doneButton",
				scope  : this
			}, {
				xtype  : 'button',
				text   : _('Cancel'),
				handler: this.onCancel,
				scope  : this
			}]
		});

		Zarafa.plugins.files.backend.Owncloud.ui.FilesShareDialogPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create the onUpdate and onRemove listeners for the {@link Zarafa.plugins.files.backend.Owncloud.data.ShareGridStore ShareGridStore}.
	 * @private
	 */
	setupGridStoreListeners: function () {
		var store = Zarafa.plugins.files.backend.Owncloud.data.singleton.ShareStore.getStore();
		store.on("add", this.onGridStoreAdd, this);
		store.on("update", this.onGridStoreUpdate, this);
		store.on("remove", this.onGridStoreRemove, this);
	},

	/**
	 * Eventhandler for the remove event of the {@link Zarafa.plugins.files.backend.Owncloud.data.ShareGridStore ShareGridStore}.
	 * If the shareid is set, it will remove the share from the backend.
	 *
	 * @param store the grid store holding share records
	 * @param record the share record to remove
	 * @private
	 */
	onGridStoreRemove: function (store, record) {
		// check if an id is set - if so, remove the old share
		if (record.get("id") != "" && record.get("id") != -1) {
			this.removeShareByID(record.get("id"));
		}
	},

	/**
	 * Eventhandler for the update event of the {@link Zarafa.plugins.files.backend.Owncloud.data.ShareGridStore ShareGridStore}.
	 * This will first remove the new dirty record and then create a new one. So the save function of the store is not used :)
	 *
	 * @param store the grid store holding share records
	 * @param record the share record to update
	 * @private
	 */
	onGridStoreUpdate: function (store, record)
	{
		this.updateExistingShare(record);
	},

	/**
	 * Eventhandler for the add event of the {@link Zarafa.plugins.files.backend.Owncloud.data.ShareGridStore ShareGridStore}.
	 * This will add a new entry to the gridstore.
	 *
	 * @param store the grid store holding share records
	 * @param records the share records to add
	 * @private
	 */
	onGridStoreAdd: function (store, records) {
		// Ignore the initial loading of the store
		if(records.length != 1 || records[0].get("id") != -1) {
			return true;
		}
		this.createShare(records[0], store, false);
	},

	/**
	 * Eventhandler for the checkbox change event.
	 *
	 * @param checkbox
	 * @param checked
	 * @private
	 */
	onShareViaLinkChecked: function (checkbox, checked) {
		if (checked) {
			this.linkfieldset.show();

			// create a new share
			this.createShareByLink();
		} else {
			this.linkfieldset.hide();
			this.removeShareByID(this.linkShareID);
			this.linkShareID = -1; // reset the id
		}
	},

	/**
	 * Eventhandler for the checkbox change event.
	 *
	 * @param checkbox
	 * @param checked
	 * @private
	 */
	onUsePasswordChecked: function (checkbox, checked) {
		if (checked) {
			this.passwordfield.show();
		} else {
			this.passwordfield.hide();
		}
	},

	/**
	 * Eventhandler for the textfield change event.
	 *
	 * @param field
	 * @param event
	 * @private
	 */
	onPasswordChange: function (field, event) {
		this.passwordChanged = true;
	},

	/**
	 * Eventhandler for the checkbox change event.
	 *
	 * @param checkbox
	 * @param checked
	 * @private
	 */
	onAllowEditingChecked: function (checkbox, checked) {
		this.pubUploadChanged = true;
	},

	/**
	 * Eventhandler for the checkbox change event.
	 *
	 * @param checkbox
	 * @param checked
	 * @private
	 */
	onUseExpirationDateChecked: function (checkbox, checked) {
		if (checked) {
			this.expirationfield.show();
		} else {
			this.expirationfield.hide();
		}
	},

	/**
	 * Eventhandler for the datefield change event.
	 *
	 * @private
	 */
	onExpirationDateChange: function () {
		this.expirationDateChanged = true;
	},

	/**
	 * Event handler which is triggered when the user presses the cancel
	 * {@link Ext.Button button}. This will close this dialog.
	 * @private
	 */
	onCancel : function()
	{
		this.dialog.close();
	},

	/**
	 * Close the dialog and clean all eventhandlers.
	 * @private
	 */
	closeDialog: function () {
		var store = Zarafa.plugins.files.backend.Owncloud.data.singleton.ShareStore.getStore();

		store.un("update", this.onGridStoreUpdate, this);
		store.un("remove", this.onGridStoreRemove, this);

		this.dialog.close();
	},

	/**
	 * Close the loadmask
	 * @private
	 */
	closeLoadMask: function () {
		this.loadMask.hide();
	},

	/**
	 * Eventhandler for the "done" button.
	 * It will save all changes of the linkshare and close the dialog.
	 * @private
	 */
	onDoneButtonClick: function () {

		// check if we have a link or user/group share
		if (this.linkcheckbox.getValue()) { // we have a link share
			// check if we have to update the share
			this.updateExistingShare();
		} else { // we have a user/group share
			this.closeDialog();
		}
	},

	/**
	 * Eventhandler for the "copy url" button.
	 * Copies the sharelink url to the users clipboarl. When IE is no
	 * longer supported switch to the navigator.clipboard API.
	 * @private
	*/
	onCopyUrl: function() {
		this.linkfield.el.dom.select()
		document.execCommand("copy");
	},

	/**
	 * This method checks the dialog records for existing shares. If shares were found, it will try to load the details.
	 * @private
	 */
	checkSharedRecord: function () {
		// init loading mask after the panel was rendered
		this.loadMask = new Ext.LoadMask(this.getEl(), {msg: _("Loading details...")});

		// check if we have a shared record where we should load details
		if (Ext.isDefined(this.parentRecord)) {

			// enable the edit checkbox if we have a folder record
			if (this.parentRecord.get("type") === Zarafa.plugins.files.data.FileTypes.FOLDER) {
				this.editcheckbox.show();
			}

			if (this.parentRecord.get("isshared") === true) {
				this.initSharedRecord();
			}
		}
	},

	/**
	 * This method requests the sharedetails from the backend.
	 * @private
	 */
	initSharedRecord: function () {
		this.loadMask.show();

		var recIds = [this.recordId];

		container.getRequest().singleRequest(
			'filesbrowsermodule',
			'loadsharingdetails',
			{
				records: recIds
			},
			new Zarafa.plugins.files.backend.Owncloud.data.ResponseHandler({
				successCallback: this.initGuiFromSharedRecord.createDelegate(this)
			})
		);
	},

	/**
	 * Callback for the loadsharingdetails response. This function will initialize the UI with the given
	 * share records.
	 *
	 * @param {Object} response the response object from the share record request
	 * @private
	 */
	initGuiFromSharedRecord: function (response) {
		var shares = response.shares[this.recordId];

		for (var shareid in shares) {
			var share = shares[shareid];
			if (share.shareType === Zarafa.plugins.files.backend.Owncloud.data.RecipientTypes.LINK ) {
				// store the id of this share
				this.linkShareID = shareid;

				// change gui
				this.linkfieldset.show();
				this.linkcheckbox.suspendEvents(false); // Stop all events.
				this.linkcheckbox.setValue(true); // check checkbox
				this.linkcheckbox.resumeEvents(); // resume events
				this.linkfield.setValue(share.url);

				// check expiration
				if (!Ext.isEmpty(share.expiration)) {
					this.expirationcheckbox.setValue(true); // check checkbox
					var dt = new Date(share.expiration);
					this.expirationfield.setValue(dt);
				}
				// check password
				if (!Ext.isEmpty(share.shareWith)) {
					this.passwordcheckbox.setValue(true); // check checkbox
					this.passwordfield.setValue("******");
				}
				//check permissions
				if (!Ext.isEmpty(share.permissions)) {
					if (parseInt(share.permissions) === 7) {
						this.editcheckbox.suspendEvents(false); // Stop all events.
						this.editcheckbox.setValue(true); // check checkbox
						this.editcheckbox.resumeEvents(); // resume events
					}
				}
			} else if (share.shareType === Zarafa.plugins.files.backend.Owncloud.data.RecipientTypes.GROUP) {
				Zarafa.plugins.files.backend.Owncloud.data.singleton.ShareStore.addGroup(share);
			} else {
				Zarafa.plugins.files.backend.Owncloud.data.singleton.ShareStore.addUser(share);
			}

			this.doneButton.setDisabled(false);
		}

		this.loadMask.hide();
	},

	/**
	 * This method will request the creation of a new linkshare from the backend.
	 * @private
	 */
	createShareByLink: function () {
		this.loadMask.show();

		var recIds = [this.recordId];

		var shareOpts = {
			shareType: Zarafa.plugins.files.backend.Owncloud.data.RecipientTypes.LINK
		};

		container.getRequest().singleRequest(
			'filesbrowsermodule',
			'createnewshare',
			{
				records: recIds,
				options: shareOpts
			},
			new Zarafa.plugins.files.backend.Owncloud.data.ResponseHandler({
				successCallback: this.shareByLinkCreated.createDelegate(this),
				failureCallback: this.closeDialog.createDelegate(this)
			})
		);
	},

	/**
	 * Callback for the createnewshare response. It will update the parent record and the UI.
	 *
	 * @param {Object} response the share link creation response
	 * @private
	 */
	shareByLinkCreated: function (response) {
		var share = response.shares[this.recordId.replace(/\/+$/g, "")];
		this.linkfield.setValue(share["url"]);

		// store the id of this share
		this.linkShareID = share["id"];

		var recIds = this.parentRecord.get("sharedid") || [];
		recIds.push(share["id"]);

		// also update the parent record
		this.parentRecord.set("sharedid", recIds);
		this.parentRecord.set("isshared", true);

		// enable the done button
		this.doneButton.setDisabled(false);

		this.loadMask.hide();
	},

	/**
	 * This method will request the deletion of a one share from the backend.
	 * @private
	 */
	removeShareByID: function (id) {
		this.loadMask.show();
		var accId = this.parentRecord.getAccount().get("id");

		container.getRequest().singleRequest(
			'filesbrowsermodule',
			'deleteexistingshare',
			{
				records  : [id],
				accountid: accId
			},
			new Zarafa.plugins.files.backend.Owncloud.data.ResponseHandler({
				successCallback: this.shareByIDRemoved.createDelegate(this, [id], true),
				failureCallback: this.closeDialog.createDelegate(this)
			})
		);
	},

	/**
	 * Callback for the deleteexistingshare response. It will update the parent record and the UI.
	 *
	 * @param {Object} response
	 * @param {Number} id
	 * @private
	 */
	shareByIDRemoved: function (response, id) {
		var recIds = this.parentRecord.get("sharedid") || [];
		var index = recIds.indexOf(id);

		if (index > -1) {
			recIds.splice(index, 1); // remove the id from the array
		}

		// also update the parent record
		this.parentRecord.set("sharedid", recIds);

		if (recIds.length == 0) {
			this.parentRecord.set("isshared", false);
		}
		this.loadMask.hide();
	},

	/**
	 * This method will request the creation or update of a user or group share from the backend.
	 *
	 * @param record holding data for the share to be create
	 * @param store the gridstore
	 * @private
	 */
	createShare: function (record, store)
	{
		this.loadMask.show();
		var recIds = [this.recordId]; // we're only going to share one file
		var permissions = this.getPermissions(record);
		var shareOpts = {
			shareType: record.get("type") === "user" ? Zarafa.plugins.files.backend.Owncloud.data.RecipientTypes.USER : Zarafa.plugins.files.backend.Owncloud.data.RecipientTypes.GROUP,
			shareWith: record.get("shareWith"),
			permissions: permissions,
			shareWithDisplayname: record.get("shareWithDisplayname")
		};

		container.getRequest().singleRequest(
			'filesbrowsermodule',
			'createnewshare',
			{
				records: recIds,
				options: shareOpts
			},
			new Zarafa.plugins.files.backend.Owncloud.data.ResponseHandler({
				successCallback: this.shareCreated.createDelegate(this, [shareOpts, record], true),
				failureCallback: this.shareFailed.createDelegate(this, [store, record])
			})
		);
	},

	/**
	 * successCallback for the createnewshare response. It will update the parent record and the UI.
	 *
	 * @param {Object} response the response object from the createnewshare request
	 * @param {Object} shareOpts object with sharing options
	 * @param {Ext.data.Record} record share options record.
	 * @private
	 */
	shareCreated: function (response, shareOpts, record)
	{
		var share = response.shares[this.recordId.replace(/\/+$/g, "")];
		var recIds = this.parentRecord.get("sharedid") || [];
		recIds.push(share["id"]);
		record.data.id = share["id"];

		// update the parent record
		this.parentRecord.set("sharedid", recIds);
		this.parentRecord.set("isshared", true);
		shareOpts.id = share.id;

		this.loadMask.hide();
	},

	/**
	 * failureCallback for the createnewshare response. It will remove the record that has been tried to add.
	 * @param store the grid store
	 * @param record record that should be created
	 * @private
	 */
	shareFailed: function (store, record) {
		store.remove(record);
				this.loadMask.hide();
		},

	/**
	 * This method will request the modification of the lin share options from the backend.
	 *
	 * @param {Ext.data.Record} record share options record.
	 */
	updateExistingShare: function (record)
	{
		this.loadMask.show();
		var shareOpts = {};
		var records = [];
		if (Ext.isDefined(record)) {
			shareOpts["permissions"] = this.getPermissions(record);
			records.push(record.get("id"));
		} else {
			if (this.passwordChanged) {
				shareOpts["password"] = this.passwordfield.getValue();
			}
			if (!this.passwordcheckbox.getValue()) {
				shareOpts["password"] = "";
			}
			if (this.pubUploadChanged) {
				// don't use publicUpload as this flag does not work (yet?) - ocs bug

				if (this.editcheckbox.getValue()) {
					shareOpts["permissions"] = 7;
				} else {
					shareOpts["permissions"] = 1;
				}
			}
			if (this.expirationDateChanged) {
				shareOpts["expireDate"] = this.expirationfield.getRawValue();
			}
			if (!this.expirationcheckbox.getValue()) {
				shareOpts["expireDate"] = "";
			}
			records.push(this.linkShareID);
		}

		container.getRequest().singleRequest(
			'filesbrowsermodule',
			'updateexistingshare',
			{
				records: records,
				accountid: this.parentRecord.getAccount().get("id"),
				options: shareOpts
			},
			new Zarafa.plugins.files.backend.Owncloud.data.ResponseHandler({
				successCallback: this.shareByLinkUpdated.createDelegate(this, [record]),
				failureCallback: this.closeLoadMask.createDelegate(this)
			})
		);
	},

	/**
	 * Callback for the updateexistingshare response. This function simply closes the dialog.
	 *
	 * @param {Ext.data.Record} record share options record.
	 * @private
	 */
	shareByLinkUpdated: function (record)
	{
		this.loadMask.hide();
		if (!Ext.isDefined(record)) {
			this.closeDialog();
		}
	},

	/**
	 * Helper function to get permission from record.
	 *
	 * @param {Ext.data.Record} record share options record.
	 * @returns {number} permissions return calculated permissions.
	 */
	getPermissions: function (record)
	{
		var permissions = 1;
		if (record.get("permissionChange")) {
			permissions += 2;
		}
		if (record.get("permissionCreate")) {
			permissions += 4;
		}
		if (record.get("permissionDelete")) {
			permissions += 8;
		}
		if (record.get("permissionShare")) {
			permissions += 16;
		}

		return permissions;
	}
});

Ext.reg('filesplugin.owncloud.filessharedialogpanel', Zarafa.plugins.files.backend.Owncloud.ui.FilesShareDialogPanel);
