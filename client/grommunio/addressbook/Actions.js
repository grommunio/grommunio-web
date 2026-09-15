/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.addressbook');

/**
 * @class Grommunio.addressbook.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Grommunio.addressbook.Actions = {
	/**
	 * Open the address book
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openAddressBook: function(config)
	{
		config = Ext.applyIf(config || {}, {
			modal: true
		});

		var componentType = Grommunio.core.data.SharedComponentType['addressbook.dialog.addressbook'];
		Grommunio.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Open the details panel for the selected records
	 * @param {Grommunio.core.data.IPMRecord} records The records for which
	 * the details {@link Grommunio.core.ui.ContentPanel contentpanel} must be shown
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openDetailsContent: function(records, config)
	{
		if (Array.isArray(records) && !Ext.isEmpty(records)) {
			records = records[0];
		}
		if (records.isPersonalDistList()) {
			// A personal distlist needs to be converted to a distlist so the correct panel can be shown.
			// This must be checked before isSharedContact() because shared distlists also
			// have is_shared set and would incorrectly be opened as contacts.
			records = records.convertToDistListRecord();
			// FIXME: We put the abRecord into the ShadowStore to be able
			// to open it, and obtain all details. However, we also need to
			// find a point where we can remove it again.
			container.getShadowStore().add(records);
		} else if (records.isPersonalContact() || records.isSharedContact()) {
			// A personal contact needs to be converted to a contact so the correct panel can be shown.
			records = records.convertToContactRecord();
			// FIXME: We put the abRecord into the ShadowStore to be able
			// to open it, and obtain all details. However, we also need to
			// find a point where we can remove it again.
			container.getShadowStore().add(records);
		}

		config = Ext.applyIf(config || {}, {
			modal: true
		});

		Grommunio.core.data.UIFactory.openViewRecord(records, config);
	}
};
