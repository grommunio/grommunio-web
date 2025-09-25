Ext.namespace('Zarafa.plugins.files.backend.Default.data');

/**
 * @class Zarafa.plugins.files.backend.Default.data.ShareGridRecord
 *
 * This class specifies the ShareGridRecord and it's fields.
 */
Zarafa.plugins.files.backend.Default.data.ShareGridRecord =
	Ext.data.Record.create(
		{ name: 'id', type: 'string' },
		{ name: 'shareWith', type: 'string' },
		{ name: 'shareWithDisplayname', type: 'string' },
		{ name: 'type', type: 'string' },
		{ name: 'permissionCreate', type: 'bool' },
		{ name: 'permissionChange', type: 'bool' },
		{ name: 'permissionDelete', type: 'bool' },
		{ name: 'permissionShare', type: 'bool' },
	);
