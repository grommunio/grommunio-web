Ext.namespace('Zarafa.contact');

/**
 * @class Zarafa.contact.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Zarafa.contact.Actions = {

	/**
	 * Opens a contact or distlist content panel based on the message class of record.
	 * Function will check record's message_class, If it is
	 * IPM.Contact It will open contact content panel - Zarafa.contact.dialogs.ContactContentPanel
	 * IPM.DistList It will open distlist content panel - Zarafa.contact.dialogs.DistListContentPanel
	 *
	 * @param {Zarafa.core.data.IPMRecord|Zarafa.core.data.IPMRecord[]} record
	 * The record/records which will be loaded in content panel for editing.
	 * @param {Object} config (optional) Configuration object for creating a ContentPanel
	 */
	openDialog : function(record, config)
	{
		if(Array.isArray(record)) {
			for(var index = 0, len = record.length; index < len; index++) {
				Zarafa.contact.Actions.openDialog(record[index], config);
			}
			return;
		}

		if(record.isMessageClass('IPM.Contact', true)) {
			this.openContactContent(record, config);
		} else if (record.isMessageClass('IPM.DistList', true)) {
			this.openDistlistContent(record, config);
		}
	},


	/**
	 * Opens a {@link Zarafa.contact.dialogs.ContactContentPanel ContactContentPanel}.
	 * @param {Zarafa.core.data.IPMRecord|Zarafa.core.data.IPMRecord[]} record
	 * The record/records which will be loaded in content panel for editing.
	 * @param {Object} config (optional) Configuration object
	 */
	openContactContent : function(record, config)
	{
		if(Array.isArray(record)) {
			for(var index = 0, len = record.length; index < len; index++) {
				Zarafa.contact.Actions.openContactContent(record[index], config);
			}
			return;
		}

		if(!Ext.isEmpty(record)) {
			Zarafa.core.data.UIFactory.openCreateRecord(record, config);
		}
	},

	/**
	 * Opens a {@link Zarafa.contact.dialogs.ContactContentPanel ContactContentPanel}.
	 * @param {Zarafa.contact.ContactContextModel} model
	 * model object that will be used to create a new {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * in {@link Zarafa.core.data.IPMStore IPMStore}.
	 * @param {Object} config (optional) Configuration object
	 */
	openCreateContactContent : function(model, config)
	{
		var record = model.createRecord(undefined, false);
		
		Zarafa.contact.Actions.openContactContent(record, config);
	},

	/**
	 * Opens a {@link Zarafa.contact.dialogs.DistlistContentPanel DistlistContentPanel}.
	 * @param {Zarafa.core.data.IPMRecord|Zarafa.core.data.IPMRecord[]} record
	 * The record/records which will be loaded in content panel for editing.
	 * in {@link Zarafa.core.data.IPMStore IPMStore}.
	 * @param {Object} config (optional) Configuration object
	 */
	openDistlistContent : function(record, config)
	{
		if(Array.isArray(record)) {
			for(var index = 0, len = record.length; index < len; index++) {
				Zarafa.contact.Actions.openDistlistContent(record[index], config);
			}
			return;
		}

		if(!Ext.isEmpty(record)) {
			Zarafa.core.data.UIFactory.openCreateRecord(record, config);
		}
	},

	/**
	 * Function will open a new {@link Zarafa.contact.dialogs.ContactContentPanel}
	 * with all information prefilled to add a recipient as a contact.
	 *
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} event The click event object.
	 * @private
	 */
	openRecipientContactContent: function(button, event) {

		// When the button belongs to one of the currently opened popout windows then
		// it is required to bring the main webapp window to front prior to switching to the contact context.
		if (!Zarafa.core.BrowserWindowMgr.isOwnedByMainWindow(button)) {
			Zarafa.core.BrowserWindowMgr.switchFocusToMainWindow(button);
		}

		var contactRecord = this.getModel().createRecord();
		var record = button.getRecords();

		Zarafa.core.data.UIFactory.openCreateRecord(contactRecord);
		contactRecord.beginEdit();
		contactRecord.set('display_name', record.get('display_name'));
		contactRecord.set('email_address_1', record.get('smtp_address'));
		contactRecord.set('email_address_type_1', record.get('address_type'));
		contactRecord.updateAddressbookProps();
		
		// Use the same logic as the {@link Zarafa.contact.dialogs.ContactDetailTab ContactDetailTab}
		// to set the given_name and surname.
		var ContactParser = new Zarafa.contact.data.ContactDetailsParser();
		var data = ContactParser.parseNameInfo(record.get('display_name'));
		contactRecord.set('given_name', data['given_name']);
		contactRecord.set('surname', data['surname']);
		contactRecord.endEdit();
	},

	/**
	 * Opens a {@link Zarafa.contact.dialogs.DistlistContentPanel DistlistContentPanel}
	 * @param {Zarafa.contact.ContactContextModel} model
	 * model object that will be used to create a new {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Object} config (optional) Configuration object
	 */
	openCreateDistlistContent : function(model, config)
	{
		var record = model.createRecord(undefined, true);

		Zarafa.contact.Actions.openDistlistContent(record, config);
	},
	
	/**
	 * Function will open {@link Zarafa.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * @param {Zarafa.core.data.IPMRecord} record record that will be loaded in
	 * {@link Zarafa.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * @param {Object} config Configuration object, containing:
	 * 	- {@link Zarafa.contact.data.ContactDetailsParser} parser parser that will be used
	 * to parse details of full name and load the data in
	 * {@link Zarafa.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * 	- {@link Object} parsedData a hash map of already parsed data of full name that
	 * will be loaded in {@link Zarafa.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 */
	openDetailedNameContent : function(record, config)
	{
		if(!Ext.isEmpty(record)) {
			var componentType = Zarafa.core.data.SharedComponentType['contact.dialog.contact.namedetails'];
			config = Ext.applyIf(config || {}, {
				modal : true
			});

			Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
		}
	},

	/**
	 * Function will open {@link Zarafa.contact.dialogs.ContactAddressContentPanel ContactAddressContentPanel}.
	 * @param {Zarafa.core.data.IPMRecord} record record that will be loaded in
	 * {@link Zarafa.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * @param {Object} config A configuration object, containing:
	 * 	- {@link Zarafa.contact.data.ContactDetailsParser} parser parser that will be used
	 * to parse details of full name and load the data in
	 * {@link Zarafa.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * 	- {@link Object} parsedData a hash map of already parsed data of full name that
	 * will be loaded in {@link Zarafa.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * 	- {@link String} property property that will be modified.
	 */
	openDetailedAddressContent : function(record, config)
	{
		if(!Ext.isEmpty(record)) {
			var componentType = Zarafa.core.data.SharedComponentType['contact.dialog.contact.addressdetails'];
			config = Ext.applyIf(config || {}, {
				modal : true
			});
			
			Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
		}
	},

	/**
	 * Function will open {@link Zarafa.contact.dialogs.ContactAddressContentPanel ContactAddressContentPanel}.
	 * @param {Zarafa.core.data.IPMRecord} record record that will be loaded in
	 * {@link Zarafa.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * @param {Object} config Configuration object containing:
	 * 	- {@link Zarafa.contact.data.ContactDetailsParser} parser parser that will be used
	 * to parse details of full name and load the data in
	 * {@link Zarafa.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * 	- {@link String} property property that will be modified.
	 */
	openDetailedPhoneContent : function(record, config)
	{
		if(!Ext.isEmpty(record)) {
			var componentType = Zarafa.core.data.SharedComponentType['contact.dialog.contact.phonedetails'];
			config = Ext.applyIf(config || {}, {
				modal : true
			});
			
			Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
		}
	},

	/**
	 * Opens a {@link Zarafa.addressbook.dialogs.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 * for configuring the categories of the given {@link Zarafa.core.data.IPMRecord records}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record, or records for which the categories
	 * must be configured
	 * @param {Object} config (optional) Configuration object
	 */
	openMembersSelectionContent : function(record, config)
	{
		if(Array.isArray(record)) {
			for(var index = 0, len = record.length; index < len; index++) {
				Zarafa.contact.Actions.openMembersSelectionContent(record[index], config);
			}
			return;
		}

		// Create a copy of the record, we don't want the changes
		// to be activated until the user presses the Ok button.
		var copy = record.copy();
		var store = copy.getSubStore('members');

		Zarafa.common.Actions.openABUserMultiSelectionContent({
			callback : function() {
				record.applyData(copy);
			},
			convert : function(user) {
				return user.convertToDistlistMember();
			},
			store : store,
			selectionCfg : [{
				xtype : 'zarafa.memberboxfield',
				fieldLabel : _('Members') + ':',
				height : 50,
				boxStore : store,
				flex : 1
			}]
		});
	},

	/**
	 * Function will open a modal dialog to add external contact in distribution list,
	 * It will open with two fields name and email address.
	 * Function will open {@link Zarafa.contact.dialogs.DistlistExternalMemberContentPanel DistlistExternalMemberContentPanel}.
	 * @param {Zarafa.contact.DistlistMemberRecord} record The member record which is shown in dialog
	 * @param {Object} config Configuration object containing
	 * 	- {@link Zarafa.core.data.IPMRecord} parentRecord The parent distribution list record.
	 */
	openDistlistExternalMemberContent : function(record, config)
	{
		var componentType = Zarafa.core.data.SharedComponentType['contact.dialog.distlist.externalmember'];
		config = Ext.applyIf(config || {}, {
			modal : true
		});

		Zarafa.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Function will open a
	 * {@link Zarafa.contact.dialogs.ContactContentPanel} for contact members,
	 * {@link Zarafa.contact.dialogs.DistlistContentPanel} for distlist members,
	 * {Zarafa.addressbook.dialogs.ABUserDetailContentPanel} for addressbook users,
	 * {Zarafa.addressbook.dialogs.ABGroupDetailContentPanel} for addressbook groups,
	 * and {Zarafa.contact.dialogs.DistlistExternalMemberContentPanel} for external members.
	 * 
	 * @param {Zarafa.contact.DistlistMemberRecord} record The distlist member record
	 * @param {Zarafa.core.data.IPMRecord} parentRecord The distlist record which 
	 * contains memberStore for distribution list members
	 */
	openDistlistMember : function(record, parentRecord)
	{
		if (record) {
			var openRecord;
			switch(record.get('distlist_type')){
				case Zarafa.core.mapi.DistlistType.DL_USER:
				case Zarafa.core.mapi.DistlistType.DL_USER2:
				case Zarafa.core.mapi.DistlistType.DL_USER3:
				case Zarafa.core.mapi.DistlistType.DL_DIST:
					// Contacts and distribution list from contact folders
					openRecord = record.convertToContactRecord();
				break;
				case Zarafa.core.mapi.DistlistType.DL_USER_AB:
				case Zarafa.core.mapi.DistlistType.DL_DIST_AB:
					// contacts and distribution list from Addressbook
					// implement at server mapisession->openentry.
					openRecord = record.convertToAddressBookRecord();
					break;
				case Zarafa.core.mapi.DistlistType.DL_EXTERNAL_MEMBER:
				/* falls through */
				default:
					// External/oneoff contacts
					Zarafa.contact.Actions.openDistlistExternalMemberContent(record, { parentRecord : parentRecord });
					break;
			}

			if(openRecord) {
				// FIXME: We put the abRecord into the ShadowStore to be able
				// to open it, and obtain all details. However, we also need to
				// find a point where we can remove it again. 
				container.getShadowStore().add(openRecord);
				Zarafa.core.data.UIFactory.openViewRecord(openRecord);
			}
		}
	}
};
