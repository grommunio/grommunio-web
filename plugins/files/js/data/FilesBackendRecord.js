Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.FilesBackendRecordFields
 *
 * These fields will be available in all 'IPM.FilesBackend' type messages.
 */
Zarafa.plugins.files.data.FilesBackendRecordFields = [
	{name: 'id'},
	{name: 'name'},
	{name: 'backend', mapping: 'name'},
	{name: 'displayName'},
	{name: 'message_class'}
];

Zarafa.core.data.RecordFactory.addFieldToMessageClass('IPM.FilesBackend', Zarafa.plugins.files.data.FilesBackendRecordFields);
Zarafa.core.data.RecordFactory.setBaseClassToMessageClass('IPM.FilesBackend', Zarafa.core.data.IPMRecord);

