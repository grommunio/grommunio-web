Ext.namespace('Zarafa.plugins.contactfax');

/**
 * @class Zarafa.plugins.contactfax.ContactFax
 * @extends Zarafa.core.Plugin
 *
 * Plugin is used to create a new item in the context menu of a contact in the Contacts context, which should only be 
 * enabled for contacts where the fax number is not empty. Clicking this item will open a new 'create mail' dialog with
 * that contact's fax numbers in the TO field of the email. fax numbers are postfixed with the domain name configured 
 * from Plugin Settings.
 * 
 */
Zarafa.plugins.contactfax.ContactFax = Ext.extend(Zarafa.core.Plugin, {
	/**
	 * The {@link Zarafa.mail.MailContextModel} which is obtained using {@link #getContextModel}.
	 * @property
	 * @type Zarafa.mail.MailContextModel
	 */
	model : undefined,

	/**
	 * Initialize the plugin by calling {@link #registerInsertionPoint}.
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.contactfax.ContactFax.superclass.initPlugin.apply(this, arguments);
		this.registerInsertionPoint('context.contact.contextmenu.actions', this.createSendFaxContextItem, this);
	},

	/**
	 * Function gets the {@link Zarafa.mail.MailContextModel MailContextModel} attached to 
	 * {@link Zarafa.mail.MailContext MailContext}.
	 * @return {Zarafa.mail.MailContextModel} Mail context model
	 */
	getMailContextModel : function()
	{
		if(!this.model) {
			var parentFolder = container.getHierarchyStore().getDefaultFolder('drafts');

			// now do round of bidding to find context attached to the folder we got
			var context = container.getContextByFolder(parentFolder);
			this.model = context.getModel();
		}

		return this.model;
	},

	/**
	 * Convert this contact record into a {@link Zarafa.core.data.IPMRecipientRecord recipient}
	 * which can be used for composing new fax mails. If multiple fax numbers are present in contact
	 * then it will create multiple {@link Zarafa.core.data.IPMRecipientRecord IPMRecipientRecord}
	 * along with domain name appended at the end of each fax number as per the configuration of 
	 * Plugin Settings.
	 *
	 * @param {Zarafa.core.mapi.RecipientType} recipientType (optional) The recipient type which should
	 * be applied to this recipient. Defaults to {@link Zarafa.core.mapi.RecipientType#MAPI_TO}.
	 * @param {Zarafa.core.data.MAPIRecord} contactRecord The current Contact record.
	 * @return {Zarafa.core.data.IPMRecipientRecord} The recipientRecord for this addressbook item
	 */
	convertToFaxRecipient : function(recipientType, contactRecord)
	{
		// each and every fax address will create a new recipient record
		var faxType = ['business_fax_number', 'home_fax_number', 'primary_fax_number'];
		var recipientRecords = [];

		for(var index = 0; index < 4; index++) {
			if(!Ext.isEmpty(contactRecord.get(faxType[index]))) {
				var postfixedEmailAddress = contactRecord.get(faxType[index]) + '@' + container.getSettingsModel().get(this.getSettingsBase() + '/faxdomain');
				var props = {
					entryid : Zarafa.core.EntryId.wrapContactProviderEntryId(contactRecord.get('entryid'), Zarafa.core.mapi.ObjectType.MAPI_MAILUSER),
					object_type : Zarafa.core.mapi.ObjectType.MAPI_MAILUSER,
					display_type : Zarafa.core.mapi.DisplayType.DT_MAILUSER,
					display_type_ex : Zarafa.core.mapi.DisplayType.DT_MAILUSER,
					display_name : contactRecord.get('display_name') + ' (' + postfixedEmailAddress + ')' ,
					smtp_address : postfixedEmailAddress,
					email_address : postfixedEmailAddress,
					address_type : 'SMTP',
					recipient_type : recipientType || Zarafa.core.mapi.RecipientType.MAPI_TO
				};

				recipientRecords.push(Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, props));
			}
		}

		return recipientRecords;

	},
	
	/**
	 * Opens a {@link Zarafa.mail.dialogs.MailCreateContentPanel MailCreateContentPanel} for the given non-recipient
	 * objects. This will convert the object into a valid Recipient Record and add it to the new mail.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} recipients The records to convert to recipients.
	 * @param {Boolean} browser (optional) If true the {@link Zarafa.core.ui.ContentPanel contentpanel}
	 * will be opened in a new browser window rather then an in-browser window.
	 */
	openFaxMailCreateDialogForContacts : function(recipients, browser)
	{
		var model = this.getMailContextModel();
		var mailRecord = model.createRecord();
		var recipientStore = mailRecord.getRecipientStore();

		recipients = Ext.isArray(recipients) ? recipients : [ recipients ];
		for (var i = 0, len = recipients.length; i < len; i++) {
			var convert = this.convertToFaxRecipient(Zarafa.core.mapi.RecipientType.MAPI_TO, recipients[i]);
			recipientStore.add(convert);
		}

		if (recipientStore.getCount() > 0) {
			Zarafa.core.data.UIFactory.openCreateRecord(mailRecord);
		}
	},

	/**
	 * @return {Boolean} True if this recipient has one or more different fax address
	 */
	hasFaxAddress : function(record)
	{
		return (!Ext.isEmpty(record.get('business_fax_number')) || !Ext.isEmpty(record.get('home_fax_number')) || !Ext.isEmpty(record.get('primary_fax_number')));
	},

	 /**
	 * Handler for extending the Contacts and AddressBook context menus
	 * with buttons to send a Fax to the given Contact and Address Book.
	 * @private
	 */
	createSendFaxContextItem : function()
	{
		return {
			text : _('Send Fax'),
			iconCls : 'icon_fax',
			scope : this,
			handler : function(item) {
				this.openFaxMailCreateDialogForContacts(item.parentMenu.records);
			},
			beforeShow : function(item, records) {
				var visible = false;

				for (var i = 0, len = records.length; i < len; i++) {
					var record = records[i];
					if (!record.isMessageClass('IPM.Contact') || this.hasFaxAddress(record)) {
						visible = true;
						break;
					}
				}

				item.setVisible(visible);
			}
		};
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'contactfax',
		displayName : _('Contact Fax'),
		pluginConstructor : Zarafa.plugins.contactfax.ContactFax
	}));
});
