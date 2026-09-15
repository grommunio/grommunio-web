/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.contact');

/**
 * @class Grommunio.contact.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Grommunio.contact.Actions = {

	/**
	 * Opens a contact or distlist content panel based on the message class of record.
	 * Function will check record's message_class, If it is
	 * IPM.Contact It will open contact content panel - Grommunio.contact.dialogs.ContactContentPanel
	 * IPM.DistList It will open distlist content panel - Grommunio.contact.dialogs.DistListContentPanel
	 *
	 * @param {Grommunio.core.data.IPMRecord|Grommunio.core.data.IPMRecord[]} record
	 * The record/records which will be loaded in content panel for editing.
	 * @param {Object} config (optional) Configuration object for creating a ContentPanel
	 */
	openDialog: function(record, config)
	{
		if(Array.isArray(record)) {
			for(var index = 0, len = record.length; index < len; index++) {
				Grommunio.contact.Actions.openDialog(record[index], config);
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
	 * Opens a {@link Grommunio.contact.dialogs.ContactContentPanel ContactContentPanel}.
	 * @param {Grommunio.core.data.IPMRecord|Grommunio.core.data.IPMRecord[]} record
	 * The record/records which will be loaded in content panel for editing.
	 * @param {Object} config (optional) Configuration object
	 */
	openContactContent: function(record, config)
	{
		if(Array.isArray(record)) {
			for(var index = 0, len = record.length; index < len; index++) {
				Grommunio.contact.Actions.openContactContent(record[index], config);
			}
			return;
		}

		if(!Ext.isEmpty(record)) {
			Grommunio.core.data.UIFactory.openCreateRecord(record, config);
		}
	},

	/**
	 * Opens a {@link Grommunio.contact.dialogs.ContactContentPanel ContactContentPanel}.
	 * @param {Grommunio.contact.ContactContextModel} model
	 * model object that will be used to create a new {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * in {@link Grommunio.core.data.IPMStore IPMStore}.
	 * @param {Object} config (optional) Configuration object
	 */
	openCreateContactContent: function(model, config)
	{
		var record = model.createRecord(undefined, false);

		Grommunio.contact.Actions.openContactContent(record, config);
	},

	/**
	 * Opens a {@link Grommunio.contact.dialogs.DistlistContentPanel DistlistContentPanel}.
	 * @param {Grommunio.core.data.IPMRecord|Grommunio.core.data.IPMRecord[]} record
	 * The record/records which will be loaded in content panel for editing.
	 * in {@link Grommunio.core.data.IPMStore IPMStore}.
	 * @param {Object} config (optional) Configuration object
	 */
	openDistlistContent: function(record, config)
	{
		if(Array.isArray(record)) {
			for(var index = 0, len = record.length; index < len; index++) {
				Grommunio.contact.Actions.openDistlistContent(record[index], config);
			}
			return;
		}

		if(!Ext.isEmpty(record)) {
			Grommunio.core.data.UIFactory.openCreateRecord(record, config);
		}
	},

	/**
	 * Function will open a new {@link Grommunio.contact.dialogs.ContactContentPanel}
	 * with all information prefilled to add a recipient as a contact.
	 *
	 * @param {Ext.Button} button button object.
	 * @param {EventObject} event The click event object.
	 * @private
	 */
	openRecipientContactContent: function(button, event) {

		// When the button belongs to one of the currently opened popout windows then
		// it is required to bring the main webapp window to front prior to switching to the contact context.
		if (!Grommunio.core.BrowserWindowMgr.isOwnedByMainWindow(button)) {
			Grommunio.core.BrowserWindowMgr.switchFocusToMainWindow(button);
		}

		var contactRecord = this.getModel().createRecord();
		var record = button.getRecords();

		Grommunio.core.data.UIFactory.openCreateRecord(contactRecord);
		contactRecord.beginEdit();
		contactRecord.set('display_name', record.get('display_name'));
		contactRecord.set('email_address_1', record.get('smtp_address'));
		contactRecord.set('email_address_type_1', record.get('address_type'));
		contactRecord.updateAddressbookProps();

		// Use the same logic as the {@link Grommunio.contact.dialogs.ContactDetailTab ContactDetailTab}
		// to set the given_name and surname.
		var ContactParser = new Grommunio.contact.data.ContactDetailsParser();
		var data = ContactParser.parseNameInfo(record.get('display_name'));
		contactRecord.set('given_name', data['given_name']);
		contactRecord.set('surname', data['surname']);
		contactRecord.endEdit();
	},

	/**
	 * Opens a {@link Grommunio.contact.dialogs.DistlistContentPanel DistlistContentPanel}
	 * @param {Grommunio.contact.ContactContextModel} model
	 * model object that will be used to create a new {@link Grommunio.core.data.IPMRecord IPMRecord}
	 * @param {Object} config (optional) Configuration object
	 */
	openCreateDistlistContent: function(model, config)
	{
		var record = model.createRecord(undefined, true);

		Grommunio.contact.Actions.openDistlistContent(record, config);
	},

	/**
	 * Function will open {@link Grommunio.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * @param {Grommunio.core.data.IPMRecord} record record that will be loaded in
	 * {@link Grommunio.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * @param {Object} config Configuration object, containing:
	 * 	- {@link Grommunio.contact.data.ContactDetailsParser} parser parser that will be used
	 * to parse details of full name and load the data in
	 * {@link Grommunio.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * 	- {@link Object} parsedData a hash map of already parsed data of full name that
	 * will be loaded in {@link Grommunio.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 */
	openDetailedNameContent: function(record, config)
	{
		if(!Ext.isEmpty(record)) {
			var componentType = Grommunio.core.data.SharedComponentType['contact.dialog.contact.namedetails'];
			config = Ext.applyIf(config || {}, {
				modal: true
			});

			Grommunio.core.data.UIFactory.openLayerComponent(componentType, record, config);
		}
	},

	/**
	 * Function will open {@link Grommunio.contact.dialogs.ContactAddressContentPanel ContactAddressContentPanel}.
	 * @param {Grommunio.core.data.IPMRecord} record record that will be loaded in
	 * {@link Grommunio.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * @param {Object} config A configuration object, containing:
	 * 	- {@link Grommunio.contact.data.ContactDetailsParser} parser parser that will be used
	 * to parse details of full name and load the data in
	 * {@link Grommunio.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * 	- {@link Object} parsedData a hash map of already parsed data of full name that
	 * will be loaded in {@link Grommunio.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * 	- {@link String} property property that will be modified.
	 */
	openDetailedAddressContent: function(record, config)
	{
		if(!Ext.isEmpty(record)) {
			var componentType = Grommunio.core.data.SharedComponentType['contact.dialog.contact.addressdetails'];
			config = Ext.applyIf(config || {}, {
				modal: true
			});

			Grommunio.core.data.UIFactory.openLayerComponent(componentType, record, config);
		}
	},

	/**
	 * Function will open {@link Grommunio.contact.dialogs.ContactAddressContentPanel ContactAddressContentPanel}.
	 * @param {Grommunio.core.data.IPMRecord} record record that will be loaded in
	 * {@link Grommunio.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * @param {Object} config Configuration object containing:
	 * 	- {@link Grommunio.contact.data.ContactDetailsParser} parser parser that will be used
	 * to parse details of full name and load the data in
	 * {@link Grommunio.contact.dialogs.ContactNameContentPanel ContactNameContentPanel}.
	 * 	- {@link String} property property that will be modified.
	 */
	openDetailedPhoneContent: function(record, config)
	{
		if(!Ext.isEmpty(record)) {
			var componentType = Grommunio.core.data.SharedComponentType['contact.dialog.contact.phonedetails'];
			config = Ext.applyIf(config || {}, {
				modal: true
			});

			Grommunio.core.data.UIFactory.openLayerComponent(componentType, record, config);
		}
	},

	/**
	 * Opens the options dialog for a contact or distribution list record.
	 *
	 * @param {Grommunio.core.data.IPMRecord|Grommunio.core.data.IPMRecord[]} records
	 * The record(s) for which the options are requested.
	 * @param {Object} config (optional) Configuration object used to create the Content Panel.
	 */
	openOptionsContent: function(records, config)
	{
		if (Array.isArray(records)) {
			records = records[0];
		}

		if (!records) {
			return;
		}

		config = Ext.applyIf(config || {}, {
			modal: true
		});

		var componentType = Grommunio.core.data.SharedComponentType['contact.dialog.options'];
		Grommunio.core.data.UIFactory.openLayerComponent(componentType, records, config);
	},

	/**
	 * Opens a {@link Grommunio.addressbook.dialogs.ABMultiUserSelectionContentPanel ABMultiUserSelectionContentPanel}
	 * for configuring the categories of the given {@link Grommunio.core.data.IPMRecord records}.
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The record, or records for which the categories
	 * must be configured
	 * @param {Object} config (optional) Configuration object
	 */
	openMembersSelectionContent: function(record, config)
	{
		if(Array.isArray(record)) {
			for(var index = 0, len = record.length; index < len; index++) {
				Grommunio.contact.Actions.openMembersSelectionContent(record[index], config);
			}
			return;
		}

		// Create a copy of the record, we don't want the changes
		// to be activated until the user presses the Ok button.
		var copy = record.copy();
		var store = copy.getSubStore('members');

		Grommunio.common.Actions.openABUserMultiSelectionContent({
			callback: function() {
				record.applyData(copy);
			},
			convert: function(user) {
				return user.convertToDistlistMember();
			},
			store: store,
			selectionCfg: [{
				xtype: 'grommunio.memberboxfield',
				fieldLabel: _('Members') + ':',
				height: 50,
				boxStore: store,
				flex: 1
			}]
		});
	},

	/**
	 * Function will open a modal dialog to add external contact in distribution list,
	 * It will open with two fields name and email address.
	 * Function will open {@link Grommunio.contact.dialogs.DistlistExternalMemberContentPanel DistlistExternalMemberContentPanel}.
	 * @param {Grommunio.contact.DistlistMemberRecord} record The member record which is shown in dialog
	 * @param {Object} config Configuration object containing
	 * 	- {@link Grommunio.core.data.IPMRecord} parentRecord The parent distribution list record.
	 */
	openDistlistExternalMemberContent: function(record, config)
	{
		var componentType = Grommunio.core.data.SharedComponentType['contact.dialog.distlist.externalmember'];
		config = Ext.applyIf(config || {}, {
			modal: true
		});

		Grommunio.core.data.UIFactory.openLayerComponent(componentType, record, config);
	},

	/**
	 * Function will open a
	 * {@link Grommunio.contact.dialogs.ContactContentPanel} for contact members,
	 * {@link Grommunio.contact.dialogs.DistlistContentPanel} for distlist members,
	 * {Grommunio.addressbook.dialogs.ABUserDetailContentPanel} for addressbook users,
	 * {Grommunio.addressbook.dialogs.ABGroupDetailContentPanel} for addressbook groups,
	 * and {Grommunio.contact.dialogs.DistlistExternalMemberContentPanel} for external members.
	 *
	 * @param {Grommunio.contact.DistlistMemberRecord} record The distlist member record
	 * @param {Grommunio.core.data.IPMRecord} parentRecord The distlist record which
	 * contains memberStore for distribution list members
	 */
	openDistlistMember: function(record, parentRecord)
	{
		if (record) {
			var openRecord;
			switch(record.get('distlist_type')){
				case Grommunio.core.mapi.DistlistType.DL_USER:
				case Grommunio.core.mapi.DistlistType.DL_USER2:
				case Grommunio.core.mapi.DistlistType.DL_USER3:
				case Grommunio.core.mapi.DistlistType.DL_DIST:
					// Contacts and distribution list from contact folders
					openRecord = record.convertToContactRecord();
				break;
				case Grommunio.core.mapi.DistlistType.DL_USER_AB:
				case Grommunio.core.mapi.DistlistType.DL_DIST_AB:
					// contacts and distribution list from Addressbook
					// implement at server mapisession->openentry.
					openRecord = record.convertToAddressBookRecord();
					break;
				case Grommunio.core.mapi.DistlistType.DL_EXTERNAL_MEMBER:
				/* falls through */
				default:
					// External/oneoff contacts
					Grommunio.contact.Actions.openDistlistExternalMemberContent(record, { parentRecord: parentRecord });
					break;
			}

			if(openRecord) {
				// FIXME: We put the abRecord into the ShadowStore to be able
				// to open it, and obtain all details. However, we also need to
				// find a point where we can remove it again.
				container.getShadowStore().add(openRecord);
				Grommunio.core.data.UIFactory.openViewRecord(openRecord);
			}
		}
	}
};
