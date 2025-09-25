Ext.namespace('Zarafa.plugins.files.backend.Default.data');

/**
 * @class Zarafa.plugins.files.backend.Default.data.ShareGridStore
 * @extends Ext.data.ArrayStore
 * @xtype filesplugin.default.sharegridstore
 *
 * This simple array store holds all group and user shares. Do not use the save or commit method as
 * the store does not implement a writer.
 */
Zarafa.plugins.files.backend.Default.data.ShareGridStore = Ext.extend(
	Ext.data.ArrayStore,
	{
		/**
		 * @constructor
		 */
		constructor: function (fileType) {
			Zarafa.plugins.files.backend.Default.data.ShareGridStore.superclass.constructor.call(
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
					fileType: fileType,
				},
			);
		},
	},
);

Ext.reg(
	'filesplugin.default.sharegridstore',
	Zarafa.plugins.files.backend.Default.data.ShareGridStore,
);
