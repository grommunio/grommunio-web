Ext.namespace('Zarafa.note');

/**
 * @class Zarafa.note.NoteStore
 * @extends Zarafa.core.data.ListModuleStore
 * @xtype zarafa.notestore
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
Zarafa.note.NoteStore = Ext.extend(Zarafa.core.data.ListModuleStore, {
	
	/**
	 * @constructor
	 * @param {Object} config configuration params that should be used to create instance of this store.
	 */
	constructor : function(config)
	{
		config = config || {};

		// Apply default settings.
		Ext.applyIf(config, {
			preferredMessageClass : 'IPM.StickyNote',
			defaultSortInfo : {
				field		: 'subject',
				direction	: 'asc'
			}
		});

		Zarafa.note.NoteStore.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.notestore', Zarafa.note.NoteStore);
