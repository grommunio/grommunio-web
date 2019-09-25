/*
 * #dependsFile client/zarafa/core/data/RecordFactory.js
 */
Ext.namespace('Zarafa.contact');

/**
 * @class Zarafa.contact.ContactRecordFields
 * Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.core.data.IPMRecord IPMRecord} object.
 * These fields will be available in all 'IPM.Contact' type messages.
 */
Zarafa.contact.ContactRecordFields = [
	// name
	{name: 'fileas'},
	{name: 'fileas_selection', type: 'int', defaultValue: -1},
	{name: 'display_name'},
	{name: 'given_name'},
	{name: 'middle_name'},
	{name: 'surname'},
	{name: 'nickname'},
	{name: 'display_name_prefix'},
	{name: 'generation'},

	// email
	{name: 'email_address'},
	{name: 'email_index', type: 'number', defaultValue: -1},

	{name: 'email_address_1'},
	{name: 'email_address_display_name_1'},
	{name: 'email_address_display_name_email_1'},
	{name: 'email_address_type_1'},
	{name: 'email_address_entryid_1'},

	{name: 'email_address_2'},
	{name: 'email_address_display_name_2'},
	{name: 'email_address_display_name_email_2'},
	{name: 'email_address_type_2'},
	{name: 'email_address_entryid_2'},

	{name: 'email_address_3'},
	{name: 'email_address_display_name_3'},
	{name: 'email_address_display_name_email_3'},
	{name: 'email_address_type_3'},
	{name: 'email_address_entryid_3'},

	// fax
	{name: 'fax_1_email_address'},							// expansion of primary_fax_number
	{name: 'fax_1_original_display_name'},
	{name: 'fax_1_address_type'},
	{name: 'fax_1_original_entryid'},
	{name: 'fax_2_email_address'},							// expansion of business_fax_number
	{name: 'fax_2_original_display_name'},
	{name: 'fax_2_address_type'},
	{name: 'fax_2_original_entryid'},
	{name: 'fax_3_email_address'},							// expansion of home_fax_number
	{name: 'fax_3_original_display_name'},
	{name: 'fax_3_address_type'},
	{name: 'fax_3_original_entryid'},

	// address
	{name: 'business_address'},
	{name: 'business_address_street'},
	{name: 'business_address_city'},
	{name: 'business_address_state'},
	{name: 'business_address_postal_code'},
	{name: 'business_address_country'},

	{name: 'home_address'},
	{name: 'home_address_street'},
	{name: 'home_address_city'},
	{name: 'home_address_state'},
	{name: 'home_address_postal_code'},
	{name: 'home_address_country'},

	{name: 'other_address'},
	{name: 'other_address_street'},
	{name: 'other_address_city'},
	{name: 'other_address_state'},
	{name: 'other_address_postal_code'},
	{name: 'other_address_country'},

	{name: 'mailing_address', type: 'int'},

	// telephone
	{name: 'home_telephone_number'},
	{name: 'cellular_telephone_number'},
	{name: 'assistant_telephone_number'},
	{name: 'business_telephone_number'},
	{name: 'business2_telephone_number'},
	{name: 'callback_telephone_number'},
	{name: 'car_telephone_number'},
	{name: 'company_telephone_number'},
	{name: 'home2_telephone_number'},
	{name: 'isdn_number'},
	{name: 'other_telephone_number'},
	{name: 'pager_telephone_number'},
	{name: 'primary_telephone_number'},
	{name: 'radio_telephone_number'},
	{name: 'telex_telephone_number'},
	{name: 'ttytdd_telephone_number'},

	// fax
	{name: 'business_fax_number'},
	{name: 'home_fax_number'},
	{name: 'primary_fax_number'},

	// general
	{name: 'title'},
	{name: 'company_name'},
	{name: 'department_name'},
	{name: 'office_location'},
	{name: 'profession'},
	{name: 'manager_name'},
	{name: 'assistant'},
	{name: 'nickname'},
	{name: 'has_picture'},
	{name: 'hide_attachments'},
	{name: 'spouse_name'},
	{name: 'birthday', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'wedding_anniversary', type: 'date', dateFormat: 'timestamp', defaultValue: null},
	{name: 'birthday_eventid'},
	{name: 'anniversary_eventid'},
	{name: 'im'},
	{name: 'business_home_page'},
	{name: 'webpage'},
	{name: 'private', type: 'boolean', defaultValue: false},
	{name: 'sensitivity', type: 'int', defaultValue: Zarafa.core.mapi.Sensitivity['NONE']},
	{name: 'contacts_string'},
	{name: 'contacts'},
	{name: 'message_flags', type: 'int', defaultValue: Zarafa.core.mapi.MessageFlags.MSGFLAG_READ},
	{name: 'address_type', type: 'string', defaultValue: 'SMTP'},
	{name: 'address_book_long', type: 'int', defaultValue: 0},
	{name: 'address_book_mv', defaultValue: null},

	/**
	 * Below properties are not actual properties of contact (IPM.Contact), so these properties
	 * are not saved in IMessage object, but instead these properties are used to create recurring
	 * yearly appointment for birthday and wedding_anniversary because when creating recurring
	 * appointment we need timezone struct of client.
	 */
	// TODO: Move all Timezone properties into a single object
	{name: 'timezone', type: 'int'},
	{name: 'timezone_unk', mapping: 'unk', type: 'int'},
	{name: 'timezone_timezonedst', mapping: 'timezonedst', type: 'int'},
	{name: 'timezone_dstendmonth', mapping: 'dstendmonth', type: 'int'},
	{name: 'timezone_dstendweek', mapping: 'dstendweek', type: 'int'},
	{name: 'timezone_dstendday', mapping: 'dstendday', type: 'int'},
	{name: 'timezone_dstendhour', mapping: 'dstendhour', type: 'int'},
	{name: 'timezone_dststartmonth', mapping: 'dststartmonth', type: 'int'},
	{name: 'timezone_dststartweek', mapping: 'dststartweek', type: 'int'},
	{name: 'timezone_dststartday', mapping: 'dststartday', type: 'int'},
	{name: 'timezone_dststarthour', mapping: 'dststarthour', type: 'int'}
];

/**
 * @class Zarafa.contact.ContactRecord
 * @extends Zarafa.core.data.IPMRecord
 * 
 * An extension to the {@link Zarafa.core.data.IPMRecord IPMRecord} specific to records which are
 * used as Contacts
 */
Zarafa.contact.ContactRecord = Ext.extend(Zarafa.core.data.IPMRecord, {

	/**
	 * @return {Boolean} True if this recipient has an email address
	 */
	hasEmailAddress : function()
	{
		return !Ext.isEmpty(this.get('email_address_1')) || !Ext.isEmpty(this.get('email_address_2')) || !Ext.isEmpty(this.get('email_address_3'));
	},

	/**
	 * Convert this contact record into a {@link Zarafa.core.data.IPMRecipientRecord recipient}
	 * which can be used for composing news mails. If multiple email addresses are present in contact
	 * then it will create multiple {@link Zarafa.core.data.IPMRecipientRecord IPMRecipientRecord}.
	 *
	 * @param {Zarafa.core.mapi.RecipientType} recipientType (optional) The recipient type which should
	 * be applied to this recipient. Defaults to {@link Zarafa.core.mapi.RecipientType#MAPI_TO}.
	 * @param {Boolean} multiple (Optional) Flag will indicate that caller expects multiple recipient record if contact
	 * contains multiple email addresses or a single recipient with default email address.
	 * @return {Zarafa.core.data.IPMRecipientRecord} The recipientRecord for this addressbook item
	 */
	convertToRecipient : function(recipientType, multiple)
	{
		// every email address will create a new recipient record
		var recipientRecords = [];

		if(multiple === true) {
			for(var index = 1; index < 4; index++) {
				if(!Ext.isEmpty(this.get('email_address_' + index))) {
					var props = {
						entryid : Zarafa.core.EntryId.wrapContactProviderEntryId(this.get('entryid'), Zarafa.core.mapi.ObjectType.MAPI_MAILUSER),
						object_type : Zarafa.core.mapi.ObjectType.MAPI_MAILUSER,
						display_type : Zarafa.core.mapi.DisplayType.DT_MAILUSER,
						display_type_ex : Zarafa.core.mapi.DisplayType.DT_MAILUSER,
						display_name : this.get('email_address_display_name_' + index) || this.get('display_name'),
						smtp_address : this.get('email_address_' + index),
						email_address : this.get('email_address_' + index),
						address_type : this.get('email_address_type_' + index) || 'SMTP',
						recipient_type : recipientType || Zarafa.core.mapi.RecipientType.MAPI_TO
					};

					recipientRecords.push(Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, props));
				}
			}

			return recipientRecords;
		}

		// send only single recipient
		if(!Ext.isEmpty(this.get('email_address'))) {
			var props = {
				entryid : Zarafa.core.EntryId.wrapContactProviderEntryId(this.get('entryid'), Zarafa.core.mapi.ObjectType.MAPI_MAILUSER),
				object_type : Zarafa.core.mapi.ObjectType.MAPI_MAILUSER,
				display_type : Zarafa.core.mapi.DisplayType.DT_MAILUSER,
				display_type_ex : Zarafa.core.mapi.DisplayType.DT_MAILUSER,
				display_name : this.get('email_address_display_name') || this.get('display_name'),
				smtp_address : this.get('email_address'),
				email_address : this.get('email_address'),
				address_type : 'SMTP',
				recipient_type : recipientType || Zarafa.core.mapi.RecipientType.MAPI_TO
			};

			return Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_RECIPIENT, props);
		}
	},

	/**
	 * Convert this {@link Zarafa.contact.ContactRecord ContactRecord} into a {@link Zarafa.contact.DistlistMemberRecord DistlistMemberRecord}
	 * which can be used as record inside {@link Zarafa.contact.DistlistMemberStore}.
	 * @return {Zarafa.contact.DistlistMemberRecord} The distribution list member for distlist item.
	 */
	convertToDistlistMember : function()
	{
		/*
		 * Contacts may have three different email-ids.
		 * We show all of them in addressbook now if we send original contact's entryid
		 * then there will be duplicate entryids for different email-address of contacts
		 * so we differentiate those by using entryid_1, entryid_2 and entryid_3
		 * so remove '_x' from the entryid_x.
		 */
		var entryid = this.get('entryid');
		var uscoreIndex = entryid.indexOf('_');
		if(uscoreIndex > 0) {
			entryid = entryid.substr(0, uscoreIndex);
		}

		return Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.ZARAFA_DISTLIST_MEMBER, {
			entryid : entryid,
			address_type : this.get('address_type'),
			distlist_type : Zarafa.core.mapi.DistlistType.DL_USER,
			display_name : this.get('display_name'),
			email_address : this.get('email_address')
		});
	},

	/**
	 * This will update all timezone properties inside this record, the properties
	 * will be initialized according to the timezone information which is currently
	 * valid for this browser (See {@link Date#getTimezoneStruct}).
	 */
	updateTimezoneInformation : function()
	{
		var tz = Date.getTimezoneStruct();

		this.beginEdit();
		this.set('timezone', tz.timezone, true);
		this.set('timezone_timezonedst', tz.timezonedst, true);
		this.set('timezone_dstendmonth', tz.dstendmonth, true);
		this.set('timezone_dstendweek', tz.dstendweek, true);
		this.set('timezone_dstendday', tz.dstendday, true);
		this.set('timezone_dstendhour', tz.dstendhour, true);
		this.set('timezone_dststartmonth', tz.dststartmonth, true);
		this.set('timezone_dststartweek', tz.dststartweek, true);
		this.set('timezone_dststartday', tz.dststartday, true);
		this.set('timezone_dststarthour', tz.dststarthour, true);
		this.endEdit();
	},
	
	/**
	 * Function is used to update subject property on {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * according to changes in display_name property.
	 */
	updateSubject : function()
	{
		// prefixes/suffixes should be removed when saving subject
		var prefix = this.get('display_name_prefix');
		var generation = this.get('generation');
		var subject = this.get('display_name');
		var fileas = this.get('fileas');

		if(!Ext.isEmpty(prefix)) {
			subject = subject.replace(prefix, '');
		}

		if(!Ext.isEmpty(generation)) {
			subject = subject.replace(generation, '');
		}

		subject = subject.trim();

		if (Ext.isEmpty(fileas) && !Ext.isEmpty(subject)) {
			var display = subject.replace(prefix, '').replace(generation, '').replace(',', '');
			var fileasArray = display.trim().split(new RegExp(Zarafa.contact.data.config.SP + '|' + Zarafa.contact.data.config.NBSP, 'g'));

			if (fileasArray.length === 1) {
				fileas = fileasArray[0];
			} else {
				fileas = fileasArray.join(Zarafa.contact.data.config.NBSP);
			}
		}

		this.beginEdit();

		this.set('fileas', fileas);
		this.set('subject', subject);

		this.endEdit();
	},

	/**
	 * Function is used to update address_book_long and address_book_mv properties on {@link Zarafa.core.data.IPMRecord IPMRecord}.
	 * These properties are used by {@link Zarafa.addressbook.dialogs.AddressBookContentPanel AddressBookContentPanel} to show contact items
	 * in the addressbook.
	 *
	 * type of email address        address_book_mv         address_book_long
	 *	email1                      0                       1 (0x00000001)
	 *	email2                      1                       2 (0x00000002)
	 *	email3                      2                       4 (0x00000004)
	 *	fax2(business fax)          3                       8 (0x00000008)
	 *	fax3(home fax)              4                       16 (0x00000010)
	 *	fax1(primary fax)           5                       32 (0x00000020)
	 *
	 *	address_book_mv is a multivalued property so all the values are passed in array
	 *	address_book_long stores sum of the flags these both properties should be in sync always.
	 */
	updateAddressbookProps : function()
	{
		var addressbook_long = 0;
		var addressbook_mv = [];

		this.beginEdit();

		// email address properties
		for(var index = 1; index < 4; index++) {
			if (!Ext.isEmpty(this.get('email_address_' + index))) {
				var emailDisplayName = this.get('fileas') || '';
				if (!Ext.isEmpty(emailDisplayName)) {
					emailDisplayName += ' ';
				}
				emailDisplayName += '(' + this.get('email_address_' + index) + ')';
				this.set('email_address_display_name_' + index, emailDisplayName);
			
				if (!Ext.isEmpty(this.get('email_address_display_name_' + index))) {
					addressbook_long += Math.pow(2, index - 1);
					addressbook_mv.push(index - 1);


					this.set('email_address_display_name_email_' + index, this.get('email_address_' + index));
				} else {
					// clear previous values
					this.set('email_address_display_name_email_' + index, '');
					this.set('email_address_type_' + index, '');
				}
			} else {
				// clear previous values
				this.set('email_address_display_name_' + index, '');
				this.set('email_address_display_name_email_' + index, '');
				this.set('email_address_type_' + index, '');
			}
		}

		if(!Ext.isEmpty(this.get('primary_fax_number'))) {
			this.set('fax_1_original_display_name', this.get('subject'), true); // same as subject
			this.set('fax_1_address_type', 'FAX', true);
			this.set('fax_1_email_address', this.get('fax_1_original_display_name') + '@' + this.get('primary_fax_number'));

			addressbook_long += 32;
			addressbook_mv.push(5);
		} else {
			// clear previous values
			this.set('fax_1_original_display_name', '');
			this.set('fax_1_address_type', '');
			this.set('fax_1_email_address', '');
		}

		if(!Ext.isEmpty(this.get('business_fax_number'))) {
			this.set('fax_2_original_display_name', this.get('subject'), true); // same as subject
			this.set('fax_2_address_type', 'FAX', true);
			this.set('fax_2_email_address', this.get('fax_2_original_display_name') + '@' + this.get('business_fax_number'));

			addressbook_long += 8;
			addressbook_mv.push(3);
		} else {
			// clear previous values
			this.set('fax_2_original_display_name', '');
			this.set('fax_2_address_type', '');
			this.set('fax_2_email_address', '');
		}

		if(!Ext.isEmpty(this.get('home_fax_number'))) {
			this.set('fax_3_original_display_name', this.get('subject'), true); // same as subject
			this.set('fax_3_address_type', 'FAX', true);
			this.set('fax_3_email_address', this.get('fax_3_original_display_name') + '@' + this.get('home_fax_number'));

			addressbook_long += 16;
			addressbook_mv.push(4);
		} else {
			// clear previous values
			this.set('fax_3_original_display_name', '');
			this.set('fax_3_address_type', '');
			this.set('fax_3_email_address', '');
		}

		this.set('address_book_long', addressbook_long);
		if (addressbook_mv.length > 0) {
			this.set('address_book_mv', addressbook_mv.sort());
		} else {
			this.set('address_book_mv', null);
		}

		this.endEdit();
	},

	/**
	 * Called by the store after the record was opened successfully.
	 * When an contact has been attached as a mail item and the user
	 * opens the contact we want to give the user the option to store
	 * the contact in the default contact folder.
	 *
	 * @private
	 */
	afterOpen : function()
	{
		if (this.isSubMessage()) {
			this.beginEdit();
			this.set('attach_num', []);
			this.set('message_flags', Zarafa.core.mapi.MessageFlags.MSGFLAG_READ);
			this.set('entryid', '');
			this.endEdit();
			this.phantom = true;

			var messageClass = this.get('message_class');
			if (Ext.isEmpty(messageClass)) {
				return;
			}

			var folder = container.getHierarchyStore().getDefaultFolderFromMessageClass(messageClass);
			if (Ext.isEmpty(folder)) {
				return;
			}

			// Set store/parent entryid, to create the record in the correct store and folder.
			this.beginEdit();
			this.set('store_entryid', folder.get('store_entryid'));
			this.set('parent_entryid', folder.get('entryid'));
			this.endEdit();

		}
		return Zarafa.contact.ContactRecord.superclass.afterOpen.call(this, arguments);
	},

	/**
	 * Builds URL to download contact as RFC6350-formatted stream with vcf extension.
	 * @param {Boolean} allAsZip (optional) True to downloading all the attachments as ZIP
	 * @return {String} URL for downloading message as file.
	 */
	getDownloadMessageUrl : function(allAsZip)
	{
		var url = container.getBaseURL();
		url = Ext.urlAppend(url, 'load=download_contact');
		url = Ext.urlAppend(url, 'storeid=' + this.get('store_entryid'));
		url = Ext.urlAppend(url, 'entryid=' + this.get('entryid'));

		return url;
	}
});

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.Contact', Zarafa.contact.ContactRecordFields);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('IPM.Contact', 'attachments', Zarafa.core.data.IPMAttachmentStore);
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.Contact', Zarafa.contact.ContactRecord);
