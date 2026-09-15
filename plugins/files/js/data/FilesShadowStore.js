Ext.namespace('Grommunio.plugins.files.data');

/**
 * @class Grommunio.plugins.files.data.ShadowStore
 * @extends Grommunio.core.data.ShadowStore
 * @xtype grommunio.shadowstore
 *
 * A store which holds all items which are being created or edited within a {@link Grommunio.core.ui.ContentPanel}
 * This store only contains references of {@link Grommunio.core.data.IPMRecord} elements which have
 * been retrieved from the server by a regular {@link Grommunio.core.data.ListModuleStore}.
 * <p>
 * Each {@link Grommunio.core.ui.ContentPanel} will register the {@link Grommunio.core.data.MAPIRecord} on which it is working
 * to this {@link Grommunio.core.data.ShadowStore}
 *
 * A store that communicates with a list module on the php side. It supports listing items,
 * pagination, etc.
 * <p>
 * Pagination is not properly supported since there is no way to pass the desired page size
 * to the server side. Therefore the page size has to be hard-coded to 50 items.
 */
Grommunio.plugins.files.data.FilesShadowStore = Ext.extend(Grommunio.core.data.ShadowStore, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		var recordType = Grommunio.core.data.RecordFactory.getRecordClassByCustomType(Grommunio.core.data.RecordCustomObjectType.FILES_FOLDER);

		Ext.applyIf(config, {
			batch : false,
			proxy : new Grommunio.plugins.files.data.FilesShadowProxy(),
			writer : new Grommunio.core.data.JsonWriter(),
			reader : new Grommunio.core.data.JsonReader({
				dynamicRecord : false,
			}, recordType)
		});

		Grommunio.plugins.files.data.FilesShadowStore.superclass.constructor.call(this, config);
	}
});
