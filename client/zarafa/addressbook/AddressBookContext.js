Ext.namespace('Zarafa.addressbook');

/**
 * @class Zarafa.addressbook.AddressBookContext
 * @extends Zarafa.core.Context
 */
Zarafa.addressbook.AddressBookContext = Ext.extend(Zarafa.core.Context, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hasToolbar : false,
			hasContentPanel : false
		});

		Zarafa.addressbook.AddressBookContext.superclass.constructor.call(this, config);

		// Register addressbook specific dialog types
		Zarafa.core.data.SharedComponentType.addProperty('addressbook.dialog.addressbook');
		Zarafa.core.data.SharedComponentType.addProperty('addressbook.dialog.abuserselection');
		Zarafa.core.data.SharedComponentType.addProperty('addressbook.dialog.abmultiuserselection');
	},

	/**
	 * Bid for the type of shared component and the given record.
	 * This will bid on a dialog.crate or dialog.view for a record with a 
	 * message class set to IPM or IPM.Note.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;

		if (Ext.isArray(record)) {
			record = record[0];
		}

		switch (type) {
			case Zarafa.core.data.SharedComponentType['addressbook.dialog.addressbook']:
			case Zarafa.core.data.SharedComponentType['addressbook.dialog.abuserselection']:
			case Zarafa.core.data.SharedComponentType['addressbook.dialog.abmultiuserselection']:
				bid = 1;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				if (record instanceof Zarafa.addressbook.AddressBookRecord) {
					bid = 1;
				}
				break;
			case Zarafa.core.data.SharedComponentType['common.view']:
				if (record instanceof Zarafa.addressbook.AddressBookRecord) {
					var objType = record.get('object_type');
					var biddableObjectTypes = [
						Zarafa.core.mapi.ObjectType.MAPI_MAILUSER, 
						Zarafa.core.mapi.ObjectType.MAPI_DISTLIST,
						Zarafa.core.mapi.ObjectType.MAPI_ABCONT
					];
					// We also check whether the entryid does not indicate this entry comes from the Contact Provider
					if(biddableObjectTypes.indexOf(objType) >= 0 && !Zarafa.core.EntryId.hasContactProviderGUID(record.get('entryid'))){
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
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['addressbook.dialog.addressbook']:
				component = Zarafa.addressbook.dialogs.AddressBookContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.view']:
				switch (record.get('object_type')) {
					case Zarafa.core.mapi.ObjectType.MAPI_MAILUSER:
						component = Zarafa.addressbook.dialogs.ABUserDetailContentPanel;
						break;
					case Zarafa.core.mapi.ObjectType.MAPI_DISTLIST:
						component = Zarafa.addressbook.dialogs.ABGroupDetailContentPanel;
						break;
					case Zarafa.core.mapi.ObjectType.MAPI_ABCONT:
						component = Zarafa.addressbook.dialogs.ABGroupDetailContentPanel;
						break;
				}
				break;
			case Zarafa.core.data.SharedComponentType['addressbook.dialog.abuserselection']:
				component = Zarafa.addressbook.dialogs.ABUserSelectionContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['addressbook.dialog.abmultiuserselection']:
				component = Zarafa.addressbook.dialogs.ABMultiUserSelectionContentPanel;
				break;
			case Zarafa.core.data.SharedComponentType['common.contextmenu']:
				component = Zarafa.addressbook.ui.AddressBookContextMenu;
				break;
		}
		return component;
	}

});

Zarafa.onReady(function() {
	container.registerContext(new Zarafa.core.ContextMetaData({
		name : 'addressbook',
		allowUserVisible : false,
		pluginConstructor : Zarafa.addressbook.AddressBookContext
	}));
});
