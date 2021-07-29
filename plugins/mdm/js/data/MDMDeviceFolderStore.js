Ext.namespace('Zarafa.plugins.mdm.data');

/**
 * @class Zarafa.plugins.mdm.data.MDMDeviceFolderStore
 * @extends Zarafa.core.data.MAPISubStore
 * @xtype mdm.devicefolderstore
 * Store specific for MDM Plugin which creates {@link Zarafa.plugins.mdm.MDMDeviceFolderStore record}.
 */
Zarafa.plugins.mdm.data.MDMDeviceFolderStore = Ext.extend(Zarafa.core.data.MAPISubStore, {

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		Ext.applyIf(config, {
			autoLoad: true,
			remoteSort: false,
			reader: new Zarafa.plugins.mdm.data.JsonDeviceFolderReader({
				customObjectType: Zarafa.core.data.RecordCustomObjectType.MDM_Device_Folder
			}),
			writer: new Zarafa.plugins.mdm.data.MDMDeviceFolderWriter(),
			proxy: new Zarafa.core.data.IPMProxy({
				listModuleName: 'pluginmdmmodule',
				itemModuleName: 'pluginmdmmodule'
			})
		});

		Zarafa.plugins.mdm.data.MDMDeviceFolderStore.superclass.constructor.call(this, config);
	},

	/**
	 * Function which is use to add {@link Zarafa.plugins.mdm.data.MDMDeviceFolderRecord folder} into
	 * {@link Zarafa.plugins.mdm.MDMDeviceFolderStore store} which will share with respective device.
	 * @param {Zarafa.hierarchy.data.IPFRecord} folder folder which is will add into {@link Zarafa.plugins.mdm.MDMDeviceFolderStore store}
	 */
	addFolder : function (folder)
	{
		var record = Zarafa.core.data.RecordFactory.createRecordObjectByCustomType(Zarafa.core.data.RecordCustomObjectType.MDM_Device_Folder, {
			"entryid": folder.get("entryid")
		});
		this.add(record);
	},

	/**
	 * Function which is use to remove {@link Zarafa.plugins.mdm.data.MDMDeviceFolderRecord folder} from
	 * {@link Zarafa.plugins.mdm.MDMDeviceFolderStore store}.
	 * @param {Zarafa.hierarchy.data.IPFRecord} folder folder which is will remove from {@link Zarafa.plugins.mdm.MDMDeviceFolderStore store}
	 */
	removeFolder : function (folder)
	{
		var found = this.findBy(function (record) {
			 return Zarafa.core.EntryId.compareEntryIds(record.get("entryid"), folder.get("entryid"));
		});

		if (found >= 0) {
			this.removeAt(found);
		}
	}
});

Ext.reg('mdm.devicefolderstore', Zarafa.plugins.mdm.data.MDMDeviceFolderStore);