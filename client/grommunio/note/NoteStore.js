Ext.namespace('Grommunio.note');

/**
 * @class Grommunio.note.NoteStore
 * @extends Grommunio.core.data.ListModuleStore
 * @xtype grommunio.notestore
 *
 * The NoteStore class provides a way to connect the 'notelistmodule' in the server back-end to an
 * Ext.grid.GridPanel object. It provides a means to retrieve note listings asynchronously.
 * The store has to be initialised with a store Id, which corresponds (somewhat confusingly) to
 * a MAPI store id. The NoteStore object, once instantiated, will be able to retrieve and list
 * notes from a single specific store only.
 *
 * @constructor
 * @param {String} storeId a MAPI id that corresponds with a MAPI store on the server.
 */
Grommunio.note.NoteStore = Ext.extend(Grommunio.core.data.ListModuleStore, {

	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor: function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass: 'IPM.StickyNote',
			defaultSortInfo: {
				field		: 'subject',
				direction	: 'asc'
			}
		});

		Grommunio.note.NoteStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.notestore', Grommunio.note.NoteStore);
