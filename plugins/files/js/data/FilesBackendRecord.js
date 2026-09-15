Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.FilesBackendRecordFields
 *
 * These fields will be available in all 'IPM.FilesBackend' type messages.
 */
Grommunio.plugins.files.data.FilesBackendRecordFields = [
	{name: 'id'},
	{name: 'name'},
	{name: 'backend', mapping: 'name'},
	{name: 'displayName'},
	{name: 'message_class'}
];

Grommunio.core.data.RecordFactory.addFieldToMessageClass('IPM.FilesBackend', Grommunio.plugins.files.data.FilesBackendRecordFields);
Grommunio.core.data.RecordFactory.setBaseClassToMessageClass('IPM.FilesBackend', Grommunio.core.data.IPMRecord);

