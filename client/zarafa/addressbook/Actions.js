Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.Actions
 * Common actions which can be used within {@link Ext.Button buttons}
 * or other {@link Ext.Component components} with action handlers.
 * @singleton
 */
Zarafa.addressbook.Actions = {
	/**
	 * Open the address book
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openAddressBook : function(config)
	{
		config = Ext.applyIf(config || {}, {
			modal : true
		});

		var componentType = Zarafa.core.data.SharedComponentType['addressbook.dialog.addressbook'];
		Zarafa.core.data.UIFactory.openLayerComponent(componentType, undefined, config);
	},

	/**
	 * Open the details panel for the selected records
	 * @param {Zarafa.core.data.IPMRecord} records The records for which
	 * the details {@link Zarafa.core.ui.ContentPanel contentpanel} must be shown
	 * @param {Object} config (optional) Configuration object used to create the ContentPanel
	 */
	openDetailsContent : function(records, config)
	{
		if (Array.isArray(records) && !Ext.isEmpty(records)) {
			records = records[0];
		}

		if (records.isPersonalContact()) {
			// A personal contact needs to be converted to a contact so the correct panel can be shown.
			records = records.convertToContactRecord();
			// FIXME: We put the abRecord into the ShadowStore to be able
			// to open it, and obtain all details. However, we also need to
			// find a point where we can remove it again.
			container.getShadowStore().add(records);
		} else if (records.isPersonalDistList()) {
			// A personal distlist needs to be converted to a distlist so the correct panel can be shown.
			records = records.convertToDistListRecord();
			// FIXME: We put the abRecord into the ShadowStore to be able
			// to open it, and obtain all details. However, we also need to
			// find a point where we can remove it again.
			container.getShadowStore().add(records);
		}

		config = Ext.applyIf(config || {}, {
			modal : true
		});
		
		Zarafa.core.data.UIFactory.openViewRecord(records, config);
	}
};
