Ext.namespace('Grommunio.plugins.mdm.data');

/**
 * @class Grommunio.plugins.mdm.data.MDMDeviceFolderStore
 * @extends Grommunio.core.data.MAPISubStore
 * @xtype mdm.devicefolderstore
 * Store specific for MDM Plugin which creates {@link Grommunio.plugins.mdm.MDMDeviceFolderStore record}.
 */
Grommunio.plugins.mdm.data.MDMDeviceFolderStore = Ext.extend(Grommunio.core.data.MAPISubStore, {

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
			reader: new Grommunio.plugins.mdm.data.JsonDeviceFolderReader({
				customObjectType: Grommunio.core.data.RecordCustomObjectType.MDM_Device_Folder
			}),
			writer: new Grommunio.plugins.mdm.data.MDMDeviceFolderWriter(),
			proxy: new Grommunio.core.data.IPMProxy({
				listModuleName: 'pluginmdmmodule',
				itemModuleName: 'pluginmdmmodule'
			})
		});

		Grommunio.plugins.mdm.data.MDMDeviceFolderStore.superclass.constructor.call(this, config);
	},

	/**
	 * Function which is use to add {@link Grommunio.plugins.mdm.data.MDMDeviceFolderRecord folder} into
	 * {@link Grommunio.plugins.mdm.MDMDeviceFolderStore store} which will share with respective device.
	 * @param {Grommunio.hierarchy.data.IPFRecord} folder folder which is will add into {@link Grommunio.plugins.mdm.MDMDeviceFolderStore store}
	 */
	addFolder : function (folder)
	{
		var record = Grommunio.core.data.RecordFactory.createRecordObjectByCustomType(Grommunio.core.data.RecordCustomObjectType.MDM_Device_Folder, {
			"entryid": folder.get("entryid")
		});
		this.add(record);
	},

	/**
	 * Function which is use to remove {@link Grommunio.plugins.mdm.data.MDMDeviceFolderRecord folder} from
	 * {@link Grommunio.plugins.mdm.MDMDeviceFolderStore store}.
	 * @param {Grommunio.hierarchy.data.IPFRecord} folder folder which is will remove from {@link Grommunio.plugins.mdm.MDMDeviceFolderStore store}
	 */
	removeFolder : function (folder)
	{
		var found = this.findBy(function (record) {
			 return Grommunio.core.EntryId.compareEntryIds(record.get("entryid"), folder.get("entryid"));
		});

		if (found >= 0) {
			this.removeAt(found);
		}
	}
});

Ext.reg('mdm.devicefolderstore', Grommunio.plugins.mdm.data.MDMDeviceFolderStore);