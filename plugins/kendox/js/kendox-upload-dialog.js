Ext.namespace("Zarafa.plugins.kendox.data");

/**
 * @class Zarafa.plugins.kendox.data.AttachmentInfoResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * Attachment info specific response handler.
 */
Zarafa.plugins.kendox.data.AttachmentInfoResponseHandler = Ext.extend(
	Zarafa.core.data.AbstractResponseHandler,
	{
		/**
		 * @cfg {Function} successCallback The function which
		 * will be called after success request.
		 */
		successCallback: null,

		/**
		 * @cfg {Function} failureCallback The function which
		 * will be called after failed request.
		 */
		failureCallback: null,

		/**
		 * @param {Object} response Object contained the response data.
		 */
		doAttachmentinfo: function (response) {
			this.successCallback(response);
		},
	},
);

/**
 * @class Zarafa.plugins.kendox.data.UploadResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * Upload specific response handler.
 */
Zarafa.plugins.kendox.data.UploadResponseHandler = Ext.extend(
	Zarafa.core.data.AbstractResponseHandler,
	{
		/**
		 * @cfg {Function} successCallback The function which
		 * will be called after success request.
		 */
		successCallback: null,

		/**
		 * @cfg {Function} failureCallback The function which
		 * will be called after failed request.
		 */
		failureCallback: null,

		/**
		 * @param {Object} response Object contained the response data.
		 */
		doUpload: function (response) {
			this.successCallback(response);
		},
	},
);

Ext.reg(
	"kendox.attachmentinforesponsehandler",
	Zarafa.plugins.kendox.data.AttachmentInfoResponseHandler,
);
Ext.reg(
	"kendox.uploadresponsehandler",
	Zarafa.plugins.kendox.data.UploadResponseHandler,
);

Ext.namespace("Zarafa.plugins.kendox");

/**
 * @class Zarafa.plugins.kendox.UploadDialog
 * @extends Zarafa.core.ui.ContentPanel
 *
 * Kendox InfoShare upload dialog
 * @xtype simpledialog
 */
Zarafa.plugins.kendox.UploadDialog = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * Loading mask
	 */
	loadingMask: null,

	/**
	 * Selected mail records
	 */
	records: undefined,

	/**
	 * Selected mail to archive
	 */
	uploadRecord: null,

	/**
	 * Configured environment
	 */
	configEnvironment: undefined,

	/**
	 * Configured api url
	 */
	configApiUrl: undefined,

	/**
	 * Configured dialog web url
	 */
	configDialogUrl: undefined,

	/**
	 * Type of opload (fullEMail or attachmentsOnly)
	 */
	uploadType: "fullEmail",

	/**
	 * Max. number of selectable attachments
	 */
	maxAttachmentsNumber: 15,

	/**
	 * Max. size of selectable attachments (sum) in MB
	 */
	maxAttachmentsSizeMb: 15,

	/**
	 * Flag if attachment information is in subStore available of record
	 */
	attachmentsInSubStoreAvailable: false,
	/**
	 * Available attachments in e-mail
	 */
	attachments: [],

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function (config) {
		config = config || {};
		this.configEnvironment = this.getEnv();
		this.configApiUrl = this.getEnvSettingValue("api_url");
		this.configDialogUrl = this.getEnvSettingValue("dialog_url");
		this.maxAttachmentsNumber = this.getSettingValue(
			"max_attachments_number",
			10,
		);
		this.maxAttachmentsSizeMb = this.getSettingValue(
			"max_attachments_size_mb",
			10,
		);
		this.records = config.records;
		this.uploadRecord = this.records[0];
		this.attachmentsInSubStoreAvailable =
			this.uploadRecord.subStores.attachments !== undefined;
		if (this.attachmentsInSubStoreAvailable) {
			this.loadAttachments();
		}
		Ext.applyIf(config, {
			title: _("Mail/Document archive to Kendox InfoShare"),
			items: [
				{
					xtype: "panel",
					id: "mainPanel",
					ref: "mainPanel",
					items: [
						{
							xtype: "progress",
							ref: "attachmentInfoProgressBar",
							hidden: this.attachmentsInSubStoreAvailable,
						},
						{
							xtype: "displayfield",
							ref: "attachmentInfoProgressText",
							value: _("Attachment information is requested") + "...",
							hidden: this.attachmentsInSubStoreAvailable,
							listeners: {
								scope: this,
							},
						},
						{
							xtype: "displayfield",
							ref: "headerText",
							value:
								_("Please select the type of Archive (max") + " " +
								this.maxAttachmentsNumber.toLocaleString() + " " +
								_("files, max") + " " +
								this.maxAttachmentsSizeMb.toLocaleString() + " " +
								_("MB total size)"),
							hidden: !this.attachmentsInSubStoreAvailable,
							listeners: {
								scope: this,
							},
						},
						{
							xtype: "radiogroup",
							ref: "radioUploadType",
							name: "uploadType",
							hideLabel: true,
							columns: 1,
							hidden: !this.attachmentsInSubStoreAvailable,
							items: [
								{
									boxLabel: _("Everything - Store mail in original format"),
									name: "uploadType",
									inputValue: "fullEmail",
									checked: this.uploadType === "fullEmail",
								},
								{
									boxLabel: _("Separate - Store attachments separately"),
									name: "uploadType",
									inputValue: "attachmentsOnly",
									checked: this.uploadType === "attachmentsOnly",
								},
							],
							value: this.uploadType,
							listeners: {
								change: this.onUploadTypeChange,
								scope: this,
							},
						},
						{
							xtype: "panel",
							ref: "panelSelectAttachments",
							layout: "form",
							hidden: true,
							height: 300,
							autoScroll: true,
							items: this.getAttachmentCheckboxes(),
							listeners: {
								scope: this,
							},
						},
						{
							xtype: "displayfield",
							ref: "displayNoAttachments",
							value: _("No attachments available in mail"),
							hidden: true,
							style: {
								padding: "10px",
								backgroundColor: "#FFFFAA",
								color: "#3A3A3A",
							},
							listeners: {
								scope: this,
							},
						},
						{
							xtype: "button",
							ref: "buttonUpload",
							text: _("Start archive"),
							hidden: !this.attachmentsInSubStoreAvailable,
							style: {
								padding: "10px 0px 0px 0px",
							},
							handler: this.doUpload,
							scope: this,
						},
					],
				},
			],
			listeners: {
				scope: this,
			},
		});
		//Call superclass constructor
		Zarafa.plugins.kendox.UploadDialog.superclass.constructor.call(
			this,
			config,
		);
		// Load attachment information from backend if not available
		if (!this.attachmentsInSubStoreAvailable) {
			this.mainPanel.attachmentInfoProgressBar.wait();
			this.loadAttachments();
		}
	},

	updateViewstate: function () {
		if (this.uploadType === "attachmentsOnly") {
			this.mainPanel.panelSelectAttachments.show();
			if (this.attachments.length == 0) {
				this.mainPanel.displayNoAttachments.show();
				this.mainPanel.buttonUpload.disable();
			} else {
				this.mainPanel.displayNoAttachments.hide();
				var selectedAttachments = this.attachments.filter(
					(x) => x.selected === true,
				);
				if (selectedAttachments.length > 0)
					this.mainPanel.buttonUpload.enable();
				else this.mainPanel.buttonUpload.disable();
			}
		} else {
			this.mainPanel.panelSelectAttachments.hide();
			this.mainPanel.buttonUpload.enable();
		}
	},

	/*
	 * Load attachments from record
	 */
	loadAttachments: function () {
		this.attachments = [];
		if (this.attachmentsInSubStoreAvailable) {
			// Attachment meta data is available in substores of record, so use it
			this.uploadRecord.subStores.attachments.data.items.forEach((att) => {
				this.attachments.push({
					selected: false,
					id: att.data.attach_num,
					name: att.data.name,
					size: att.data.size,
				});
			});
		} else {
			// No attachment data is available in substores of record, so get the attachment meta data from backend
			this.doAttachmentinfo();
		}
	},

	onUploadTypeChange: function (field, value) {
		this.uploadType = value.inputValue;
		this.updateViewstate();
	},

	/**
	 * Get checkboxes for attachment selection
	 */
	getAttachmentCheckboxes: function () {
		var checkboxes = [];
		this.attachments.forEach((a) => {
			checkboxes.push({
				xtype: "checkbox",
				ref: "checkboxAttachment" + a.id,
				boxLabel:
					a.name + " (" + (a.size / 1024 / 1000).toLocaleString() + " MB)",
				style: {
					margin: "10px 0px 0px 0px",
				},
				listeners: {
					check: this.onAttachmentSelection,
					scope: this,
				},
			});
		});
		return checkboxes;
	},

	onAttachmentSelection: function (field, value) {
		var attachmentId = field.ref.replace("checkboxAttachment", "");
		var att = this.attachments.find((x) => x.id == attachmentId);
		if (att !== undefined) {
			att.selected = value;
		}
		this.updateViewstate();
	},

	/**
	 * Getting attachment meta data from backend
	 */
	doAttachmentinfo: function () {
		var payload = {
			storeId: this.uploadRecord.store.storeEntryId,
			mailEntryId: this.uploadRecord.id,
		};
		container.getRequest().singleRequest(
			"kendoxmodule",
			"attachmentinfo",
			payload,
			new Zarafa.plugins.kendox.data.AttachmentInfoResponseHandler({
				successCallback: this.onAttachmentInfoCallback.createDelegate(this),
				failureCallback: this.onErrorCallback.createDelegate(this),
			}),
		);
	},

	/**
	 * Callback on successfully uploaded e-mail
	 *
	 * @param {Object} response the response of upload action
	 * @private
	 */
	onAttachmentInfoCallback: function (response) {
		if (response.Successful === true) {
			this.attachments = response.attachments;
			this.mainPanel.attachmentInfoProgressBar.hide();
			this.mainPanel.attachmentInfoProgressText.hide();
			this.mainPanel.headerText.show();
			this.mainPanel.radioUploadType.show();
			this.mainPanel.buttonUpload.show();
			var attachmentCheckboxes = this.getAttachmentCheckboxes();
			attachmentCheckboxes.forEach((cb) => {
				this.mainPanel.panelSelectAttachments.add(cb);
			});
			this.mainPanel.panelSelectAttachments.doLayout();
			this.updateViewstate();
		} else {
			Ext.MessageBox.show({
				title: _("Kendox InfoShare") + " plugin",
				msg:   _("Reading attachment information failed") + ":\n" +
				       response.errorMessage,
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR,
			});
		}
	},

	/**
	 * Start upload of email to InfoShare
	 */
	doUpload: function () {
		if (this.loadingMask === null) {
			this.loadingMask = new Ext.LoadMask(Ext.getCmp("mainPanel").el, {
				msg: _("Files are sent to Kendox InfoShare") + "...",
			});
		} else {
		}
		this.loadingMask.show();
		var user = container.getUser();
		var selectedAttachments = [];
		var attachmentsTotalSize = 0;
		if (this.uploadType === "attachmentsOnly") {
			this.attachments
				.filter((x) => x.selected === true)
				.forEach((a) => {
					var newAttachment = {
						attachmentNumber: this.attachments.indexOf(a),
					};
					for (let prop in a) {
						newAttachment[prop] = a[prop];
					}
					newAttachment.name = btoa(newAttachment.name);
					selectedAttachments.push(newAttachment);
					attachmentsTotalSize += newAttachment.size;
				});
			if (selectedAttachments.length > this.maxAttachmentsNumber) {
				this.loadingMask.hide();
				Ext.MessageBox.show({
					title: _("Kendox InfoShare") + " plugin",
					msg:
						_("With the selection of separate attachments a maximum of") + " " +
						this.maxAttachmentsNumber.toLocaleString() + " " +
						_("attachments can be selected. There have been") + " " +
						selectedAttachments.length.toLocaleString() + " " +
						_("attachments selected"),
					buttons: Ext.MessageBox.OK,
					icon: Ext.MessageBox.ERROR,
				});
				return;
			}
			if (attachmentsTotalSize / 1024 / 1000 > this.maxAttachmentsSizeMb) {
				this.loadingMask.hide();
				Ext.MessageBox.show({
					title: _("Kendox InfoShare") + " plugin",
					msg:
						_("With the selection of separate attachments the total size of all attachments may not exceed") + " " +
						this.maxAttachmentsSizeMb.toLocaleString() + " " +
						_("MB. There have been") + " " +
						(attachmentsTotalSize / 1024 / 1000).toLocaleString() + " " +
						_("MB selected."),
					buttons: Ext.MessageBox.OK,
					icon: Ext.MessageBox.ERROR,
				});
				return;
			}
		}
		var payload = {
			storeId: this.uploadRecord.store.storeEntryId,
			mailEntryId: this.uploadRecord.id,
			uploadType: this.uploadType,
			selectedAttachments: selectedAttachments,
			environment: this.configEnvironment,
			apiUrl: this.configApiUrl,
			userEMail: user.getSMTPAddress(),
		};
		container.getRequest().singleRequest(
			"kendoxmodule",
			"upload",
			payload,
			new Zarafa.plugins.kendox.data.UploadResponseHandler({
				successCallback: this.onUploadCallback.createDelegate(this),
				failureCallback: this.onErrorCallback.createDelegate(this),
			}),
		);
	},

	/**
	 * Callback on errors
	 *
	 * @param {Object} response the response object from failed action
	 * @private
	 */
	onErrorCallback: function () {
		this.loadingMask.hide();
		this.close();
		Ext.MessageBox.show({
			title: _("Kendox InfoShare") + " plugin",
			msg: _("Sending of mail failed"),
			buttons: Ext.MessageBox.OK,
			icon: Ext.MessageBox.ERROR,
		});
	},

	/**
	 * Callback on successfully uploaded e-mail
	 *
	 * @param {Object} response the response of upload action
	 * @private
	 */
	onUploadCallback: function (response) {
		this.loadingMask.hide();
		this.close();
		if (response.Successful === true) {
			this.openWebDialog(response);
		} else {
			Ext.MessageBox.show({
				title: _("Kendox InfoShare") + " plugin",
				msg: _("Sending of mail failed") + ":\n" + response.errorMessage,
				buttons: Ext.MessageBox.OK,
				icon: Ext.MessageBox.ERROR,
			});
		}
	},

	/**
	 * Opens the web dialog for finishing the archiving process
	 *
	 * @param {Object} response Response of upload action
	 */
	openWebDialog: function (response) {
		var uploadRecord = this.uploadRecord;
		var dialogUrl = this.configDialogUrl;
		var subject = uploadRecord.data.subject;
		subject = subject.replace("[", "(");
		subject = subject.replace("]", ")");
		subject = subject.replace("#", "-");
		dialogUrl = dialogUrl.replace("{connId}", response.kendoxConnectionId);
		dialogUrl = dialogUrl.replace("{subject}", subject);
		dialogUrl = dialogUrl.replace(
			"{to}",
			this.getReceiverEMailAddress(uploadRecord.data),
		);
		dialogUrl = dialogUrl.replace(
			"{from}",
			uploadRecord.data.sender_email_address,
		);
		dialogUrl = dialogUrl.replace("{messageId}", response.messageId);
		dialogUrl = dialogUrl.replace(
			"{date}",
			uploadRecord.data.message_delivery_time.toLocaleDateString("us-US"),
		);
		var files = "";
		response.kendoxFiles.forEach((f) => {
			let fileName = f.fileName;
			fileName = fileName.replace("#", "_");
			fileName = fileName.replace("&", "_");
			fileName = fileName.replace("€", "_");
			files =
				files +
				"[" +
				f.kendoxFileId +
				"|" +
				fileName +
				"|" +
				f.fileLength +
				"]";
		});
		dialogUrl = dialogUrl.replace("{files}", files);
		dialogUrl = encodeURI(dialogUrl);
		window.open(dialogUrl, "_blank");
	},

	/**
	 * Gets the receiver e-mail address from e-mail record object
	 */
	getReceiverEMailAddress: function (message) {
		if (
			message.received_by_email_address !== "" &&
			message.received_by_email_address !== undefined
		)
			return message.received_by_email_address;
		let headers = message.transport_message_headers;
		var entries = headers.split(/\r\n/);
		var toEntry = entries.find((x) => x.substring(0, 3) === "To:");
		if (toEntry === undefined) {
			return "";
		}
		let values = toEntry.split(":");
		if (values.length !== 2) return "";
		return values[1].trim();
	},

	/**
	 * Gets the configured environment
	 *
	 * @return {string}
	 */
	getEnv: function () {
		var env = container
			.getSettingsModel()
			.get("zarafa/v1/plugins/kendox/environment");
		return env;
	},

	/**
	 * Gets a plugin setting based on the configured environment
	 *
	 * @param {string} settingName
	 * @return {string}
	 */
	getEnvSettingValue: function (settingName) {
		var environment = this.getEnv();
		var value = container
			.getSettingsModel()
			.get("zarafa/v1/plugins/kendox/" + settingName);
		if (environment !== "prod") {
			value = container
				.getSettingsModel()
				.get("zarafa/v1/plugins/kendox/" + settingName + "_" + environment);
		}
		return value;
	},

	/**
	 * Gets a plugin setting
	 *
	 * @param {string} settingName
	 * @return {string}
	 */
	getSettingValue: function (settingName, defaultOnUndefined) {
		var value = container
			.getSettingsModel()
			.get("zarafa/v1/plugins/kendox/" + settingName);
		if (value === undefined) {
			value = defaultOnUndefined;
		}
		return value;
	},
});

// Register the dialog xtype
Ext.reg("zarafa.kendoxuploaddialog", Zarafa.plugins.kendox.UploadDialog);
