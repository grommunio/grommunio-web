Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.BackendStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype filesplugin.backendstore
 *
 * The BackendStore class provides a way to connect the 'filesaccountmodule' in the server back-end to an
 * 'Account Type' combo box object which belongs to {@link Zarafa.plugins.files.settings.ui.AccountEditPanel AccountEditPanel}.
 * It provides a means to retrieve supported backend listings asynchronously.
 */
Zarafa.plugins.files.data.BackendStore = Ext.extend(Zarafa.core.data.ListModuleStore, {

	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor: function (config)
	{
		config = config || {};

		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByMessageClass('IPM.FilesBackend');

		Ext.applyIf(config, {
			preferredMessageClass: 'IPM.FilesBackend',
			autoLoad: {
				params: {
					list_backend: true
				}
			},
			reader: new Zarafa.core.data.JsonReader({
				id: 'name',
				idProperty: 'name'
			}, recordType),
			proxy: new Zarafa.core.data.IPMProxy({
				listModuleName: 'filesaccountmodule',
				itemModuleName: 'filesaccountmodule'
			})
		});

		Zarafa.plugins.files.data.BackendStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.backendstore', Zarafa.plugins.files.data.BackendStore);