Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.RowSelectionModel
 * @extends Ext.grid.RowSelectionModel
 *
 * This selection model makes use of {@link Zarafa.core.data.MAPIStore#getRecordKey} function
 * to provide a different unique id to access data. This is mainly done to provide support for records
 * which has same entryid but we need to create multiple instances of it so we need to append another
 * property to entryid to make it unique.
 */
Zarafa.common.ui.grid.RowSelectionModel = Ext.extend(Ext.grid.RowSelectionModel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		Zarafa.common.ui.grid.RowSelectionModel.superclass.constructor.call(this, config);

		// override and create new MixedCollection to use our own implementation of getKey function
		// this will discard the data stored by constructor in the MixedCollection, but i am sure that
		// constructor is not going to store any data in this MixedCollection, so that will not affect
		this.selections = new Ext.util.MixedCollection(false, function(o) {
			var store = o.store;

			if(store && Ext.isFunction(store.getRecordKey)) {
				return store.getRecordKey(o);
			}

			return o.id;
		});
	},

	/**
	 * Clears all selections if the selection model {@link Ext.grid.AbstractSelectionModel#isLocked is not locked}.
	 * This method is overriden to make sure that we don't directly access {@link Zarafa.core.data.MAPIRecord#id}
	 * instead we get uniqueid using {@link Zarafa.core.data.MAPIStore#getRecordKey}.
	 * @param {Boolean} fast (optional) <tt>true</tt> to bypass the
	 * conditional checks and events described in {@link #deselectRow}.
	 */
	clearSelections : function(fast)
	{
		if(this.isLocked()){
			return;
		}

		if(fast !== true) {
			var ds = this.grid.getStore(),
				s = this.selections;
			s.each(function(r){
				var id = (Ext.isFunction(ds.getRecordKey) && ds.getRecordKey(r)) || r.id;
				this.deselectRow(ds.indexOfId(id));
			}, this);
			s.clear();
		} else {
			this.selections.clear();
		}

		this.last = false;
	},

	/**
	 * Returns <tt>true</tt> if the specified row is selected.
	 * This method is overriden to make sure that we don't directly access {@link Zarafa.core.data.MAPIRecord#id}
	 * instead we get uniqueid using {@link Zarafa.core.data.MAPIStore#getRecordKey}.
	 * @param {Number/Record} index The record or index of the record to check
	 * @return {Boolean}
	 */
	isSelected : function(index)
	{
		var store = this.grid.getStore();
		var r = Ext.isNumber(index) ? store.getAt(index) : index;
		var id = (Ext.isFunction(store.getRecordKey) && store.getRecordKey(r)) || r.id;

		return (r && this.selections.key(id) ? true : false);
	}
});
