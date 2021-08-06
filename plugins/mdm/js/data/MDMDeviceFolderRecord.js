Ext.namespace('Zarafa.plugins.mdm');

/**
 * @class Zarafa.plugins.mdm.data.MDMDeviceFolderRecordFields
 *
 * Array of default fields for the {@link Zarafa.plugins.mdm.data.MDMDeviceFolderRecord} object.
 * These fields will always be added, regardless of the exact type of
 * {@link Zarafa.plugins.mdm.data.MDMDeviceFolderRecord record}.
 */
Zarafa.plugins.mdm.data.MDMDeviceFolderRecordFields = [
	{name: 'store', type: 'string'},
	{name: 'folderid', type: 'string'},
	{name: 'name', type: 'string'},
	{name: 'type', type: 'int'},
	{name: 'flags', type: 'int'},
	{name: 'entryid', type: 'string'}
];

Zarafa.core.data.RecordCustomObjectType.addProperty('MDM_Device_Folder');
Zarafa.core.data.RecordFactory.addFieldToCustomType(Zarafa.core.data.RecordCustomObjectType.MDM_Device_Folder, Zarafa.plugins.mdm.data.MDMDeviceFolderRecordFields);
Zarafa.core.data.RecordFactory.setBaseClassToCustomType(Zarafa.core.data.RecordCustomObjectType.MDM_Device_Folder, Zarafa.core.data.MAPIRecord);
