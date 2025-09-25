Ext.namespace('Zarafa.plugins.files.backend.Seafile.data');

/**
 * Lightweight array store that backs the share grid with in-memory data.
 */
Zarafa.plugins.files.backend.Seafile.data.ShareGridStore = Ext.extend(
	Ext.data.ArrayStore,
	{
		constructor: function (e) {
			Zarafa.plugins.files.backend.Seafile.data.ShareGridStore.superclass.constructor.call(
				this,
				{
					fields: [
						'id',
						'shareWith',
						'shareWithDisplayname',
						'type',
						'permissionCreate',
						'permissionChange',
						'permissionDelete',
						'permissionShare',
					],
					fileType: e,
				},
			);
		},
	},
);
Ext.reg(
	'filesplugin.seafile.sharegridstore',
	Zarafa.plugins.files.backend.Seafile.data.ShareGridStore,
);
