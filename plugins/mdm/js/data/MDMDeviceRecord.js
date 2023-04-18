Ext.namespace('Zarafa.plugins.mdm');

/**
 * @class Zarafa.plugins.mdm.data.MDMDeviceRecordFields Array of {@link Ext.data.Field field} configurations for the
 * {@link Zarafa.plugins.mdm.data.MDMDeviceRecord record} object.
 * @private
 */
Zarafa.plugins.mdm.data.MDMDeviceRecordFields = [
	{name: 'entryid', type: 'string'},
	{name: 'devicetype', type: 'string'},
	{name: 'deviceos', type: 'string'},
	{name: 'devicefriendlyname', type: 'string'},
	{name: 'useragent', type: 'string'},
	{name: 'asversion', type: 'string'},
	{name: 'firstsynctime', type: 'date', dateFormat: 'timestamp'},
	{name: 'lastsynctime', type: 'date', dateFormat: 'timestamp'},
	{name: 'lastupdatetime', type: 'date', dateFormat: 'timestamp'},
	{name: 'wipestatus', type: 'string'},
	{name: 'policyname', type: 'string'},
	{name: 'sharedfolders', type: 'string'},
	{name: 'shortfolderids', type: 'string'},
	{name: 'synchronizedfolders', type: 'string', defaultValue:'0'},
	{name: 'emailsfolder', type: 'string', defaultValue:'0'},
	{name: 'contactsfolder', type: 'string', defaultValue:'0'},
	{name: 'tasksfolder', type: 'string', defaultValue:'0'},
	{name: 'calendarsfolder', type: 'string', defaultValue:'0'},
	{name: 'notesfolder', type: 'string', defaultValue:'0'},
	{name: 'message_class', type: 'string', defaultValue:"IPM.MDM"}
];


Zarafa.plugins.mdm.data.MDMDeviceRecord = Ext.extend(Zarafa.core.data.IPMRecord, {});
Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.MDM', Zarafa.plugins.mdm.data.MDMDeviceRecordFields);
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.MDM', Zarafa.plugins.mdm.data.MDMDeviceRecord);
Zarafa.core.data.RecordFactory.setSubStoreToMessageClass('IPM.MDM', 'sharedfolders', Zarafa.plugins.mdm.data.MDMDeviceFolderStore);
