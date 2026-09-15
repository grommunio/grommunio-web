Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.BackendStore
 * @extends Grommunio.core.data.ListModuleStore
 * @xtype filesplugin.backendstore
 *
 * The BackendStore class provides a way to connect the 'filesaccountmodule' in the server back-end to an
 * 'Account Type' combo box object which belongs to {@link Grommunio.plugins.files.settings.ui.AccountEditPanel AccountEditPanel}.
 * It provides a means to retrieve supported backend listings asynchronously.
 */
Grommunio.plugins.files.data.BackendStore = Ext.extend(Grommunio.core.data.ListModuleStore, {

	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor: function (config)
	{
		config = config || {};

		var recordType = Grommunio.core.data.RecordFactory.getRecordClassByMessageClass('IPM.FilesBackend');

		Ext.applyIf(config, {
			preferredMessageClass: 'IPM.FilesBackend',
			autoLoad: {
				params: {
					list_backend: true
				}
			},
			reader: new Grommunio.core.data.JsonReader({
				id: 'name',
				idProperty: 'name'
			}, recordType),
			proxy: new Grommunio.core.data.IPMProxy({
				listModuleName: 'filesaccountmodule',
				itemModuleName: 'filesaccountmodule'
			})
		});

		Grommunio.plugins.files.data.BackendStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('filesplugin.backendstore', Grommunio.plugins.files.data.BackendStore);