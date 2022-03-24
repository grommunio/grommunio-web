Ext.namespace('Zarafa.plugins.files.data');

/**
 * @class Zarafa.plugins.files.data.ShadowStore
 * @extends Zarafa.core.data.ShadowStore
 * @xtype zarafa.shadowstore
 *
 * A store which holds all items which are being created or edited within a {@link Zarafa.core.ui.ContentPanel}
 * This store only contains references of {@link Zarafa.core.data.IPMRecord} elements which have
 * been retreived from the server by a regular {@link Zarafa.core.data.ListModuleStore}.
 * <p>
 * Each {@link Zarafa.core.ui.ContentPanel} will register the {@link Zarafa.core.data.MAPIRecord} on which it is working
 * to this {@link Zarafa.core.data.ShadowStore}
 *
 * A store that communicates with a list module on the php side. It supports listing items,
 * pagination, etc.
 * <p>
 * Pagination is not properly supported since there is no way to pass the desired page size
 * to the server side. Therefore the page size has to be hard-coded to 50 items.
 */
Zarafa.plugins.files.data.FilesShadowStore = Ext.extend(Zarafa.core.data.ShadowStore, {
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		var recordType = Zarafa.core.data.RecordFactory.getRecordClassByCustomType(Zarafa.core.data.RecordCustomObjectType.FILES_FOLDER);

		Ext.applyIf(config, {
			batch : false,
			proxy : new Zarafa.plugins.files.data.FilesShadowProxy(),
			writer : new Zarafa.core.data.JsonWriter(),
			reader : new Zarafa.core.data.JsonReader({
				dynamicRecord : false,
			}, recordType)
		});

		Zarafa.plugins.files.data.FilesShadowStore.superclass.constructor.call(this, config);
	}
});