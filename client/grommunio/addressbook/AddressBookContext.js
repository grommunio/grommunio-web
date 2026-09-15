/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.AddressBookContext
 * @extends Grommunio.core.Context
 */
Grommunio.addressbook.AddressBookContext = Ext.extend(Grommunio.core.Context, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hasToolbar: false,
			hasContentPanel: false
		});

		Grommunio.addressbook.AddressBookContext.superclass.constructor.call(this, config);

		// Register addressbook specific dialog types
		Grommunio.core.data.SharedComponentType.addProperty('addressbook.dialog.addressbook');
		Grommunio.core.data.SharedComponentType.addProperty('addressbook.dialog.abuserselection');
		Grommunio.core.data.SharedComponentType.addProperty('addressbook.dialog.abmultiuserselection');
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * This will bid on a dialog.crate or dialog.view for a record with a
	 * message class set to IPM or IPM.Note.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		if (Array.isArray(record)) {
			record = record[0];
		}

		switch (type) {
			case Grommunio.core.data.SharedComponentType['addressbook.dialog.addressbook']:
			case Grommunio.core.data.SharedComponentType['addressbook.dialog.abuserselection']:
			case Grommunio.core.data.SharedComponentType['addressbook.dialog.abmultiuserselection']:
				bid = 1;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Grommunio.addressbook.AddressBookRecord) {
					bid = 1;
				}
				break;
			case Grommunio.core.data.SharedComponentType['common.view']:
				if (record instanceof Grommunio.addressbook.AddressBookRecord) {
					var objType = record.get('object_type');
					var biddableObjectTypes = [
						Grommunio.core.mapi.ObjectType.MAPI_MAILUSER,
						Grommunio.core.mapi.ObjectType.MAPI_DISTLIST,
						Grommunio.core.mapi.ObjectType.MAPI_ABCONT
					];
					// We also check whether the entryid does not indicate this entry comes from the Contact Provider
					if(biddableObjectTypes.indexOf(objType) >= 0 && !Grommunio.core.EntryId.hasContactProviderGUID(record.get('entryid'))){
						bid = 1;
					}
				}
				break;
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Grommunio.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Grommunio.core.data.SharedComponentType['addressbook.dialog.addressbook']:
				component = Grommunio.addressbook.dialogs.AddressBookContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.view']:
				switch (record.get('object_type')) {
					case Grommunio.core.mapi.ObjectType.MAPI_MAILUSER:
						component = Grommunio.addressbook.dialogs.ABUserDetailContentPanel;
						break;
					case Grommunio.core.mapi.ObjectType.MAPI_DISTLIST:
						component = Grommunio.addressbook.dialogs.ABGroupDetailContentPanel;
						break;
					case Grommunio.core.mapi.ObjectType.MAPI_ABCONT:
						component = Grommunio.addressbook.dialogs.ABGroupDetailContentPanel;
						break;
				}
				break;
			case Grommunio.core.data.SharedComponentType['addressbook.dialog.abuserselection']:
				component = Grommunio.addressbook.dialogs.ABUserSelectionContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['addressbook.dialog.abmultiuserselection']:
				component = Grommunio.addressbook.dialogs.ABMultiUserSelectionContentPanel;
				break;
			case Grommunio.core.data.SharedComponentType['common.contextmenu']:
				component = Grommunio.addressbook.ui.AddressBookContextMenu;
				break;
		}
		return component;
	}

});

Grommunio.onReady(function() {
	container.registerContext(new Grommunio.core.ContextMetaData({
		name: 'addressbook',
		allowUserVisible: false,
		pluginConstructor: Grommunio.addressbook.AddressBookContext
	}));
});
