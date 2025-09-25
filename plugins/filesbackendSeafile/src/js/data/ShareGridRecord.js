Ext.namespace('Zarafa.plugins.files.backend.Seafile.data');

/**
 * Record definition representing a single share recipient entry.
 */
Zarafa.plugins.files.backend.Seafile.data.ShareGridRecord =
	Ext.data.Record.create(
		{
			name: 'id',
			type: 'string',
		},
		{
			name: 'shareWith',
			type: 'string',
		},
		{
			name: 'shareWithDisplayname',
			type: 'string',
		},
		{
			name: 'type',
			type: 'string',
		},
		{
			name: 'permissionCreate',
			type: 'bool',
		},
		{
			name: 'permissionChange',
			type: 'bool',
		},
		{
			name: 'permissionDelete',
			type: 'bool',
		},
		{
			name: 'permissionShare',
			type: 'bool',
		},
	);
