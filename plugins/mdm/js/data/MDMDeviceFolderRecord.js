Ext.namespace('Grommunio.plugins.mdm');

/**
 * @class Grommunio.plugins.mdm.data.MDMDeviceFolderRecordFields
 *
 * Array of default fields for the {@link Grommunio.plugins.mdm.data.MDMDeviceFolderRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Grommunio.plugins.mdm.data.MDMDeviceFolderRecord record}.
 */
Grommunio.plugins.mdm.data.MDMDeviceFolderRecordFields = [
	{name: 'store', type: 'string'},
	{name: 'folderid', type: 'string'},
	{name: 'name', type: 'string'},
	{name: 'type', type: 'int'},
	{name: 'flags', type: 'int'},
	{name: 'entryid', type: 'string'}
];

Grommunio.core.data.RecordCustomObjectType.addProperty('MDM_Device_Folder');
Grommunio.core.data.RecordFactory.addFieldToCustomType(Grommunio.core.data.RecordCustomObjectType.MDM_Device_Folder, Grommunio.plugins.mdm.data.MDMDeviceFolderRecordFields);
Grommunio.core.data.RecordFactory.setBaseClassToCustomType(Grommunio.core.data.RecordCustomObjectType.MDM_Device_Folder, Grommunio.core.data.MAPIRecord);
