Ext.namespace('Grommunio.plugins.mdm');

/**
 * @class Grommunio.plugins.mdm.data.MDMDeviceRecordFields Array of {@link Ext.data.Field field} configurations for the
 * {@link Grommunio.plugins.mdm.data.MDMDeviceRecord record} object.
 * @private
 */
Grommunio.plugins.mdm.data.MDMDeviceRecordFields = [
	{name: 'entryid', type: 'string'},
	{name: 'devicetype', type: 'string'},
	{name: 'deviceos', type: 'string'},
	{name: 'devicefriendlyname', type: 'string'},
	{name: 'useragent', type: 'string'},
	{name: 'asversion', type: 'string'},
	{name: 'firstsynctime', type: 'date', dateFormat: 'timestamp'},
	{name: 'lastsynctime', type: 'date', dateFormat: 'timestamp'},
	{name: 'lastupdatetime', type: 'date', dateFormat: 'timestamp'},
	{name: 'lastconnecttime', type: 'date', dateFormat: 'timestamp'},
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
	{name: 'impersonatinguser', type: 'string'},
	{name: 'message_class', type: 'string', defaultValue:"IPM.MDM"}
];


Grommunio.plugins.mdm.data.MDMDeviceRecord = Ext.extend(Grommunio.core.data.IPMRecord, {});
Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.MDM', Grommunio.plugins.mdm.data.MDMDeviceRecordFields);
Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.MDM', Grommunio.plugins.mdm.data.MDMDeviceRecord);
Grommunio.core.data.RecordFactory.setSubStoreToMessageClass('IPM.MDM', 'sharedfolders', Grommunio.plugins.mdm.data.MDMDeviceFolderStore);
