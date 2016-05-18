Ext.namespace('Zarafa.today');

/**
 * @class Zarafa.today.TodayContextModel
 * @extends Zarafa.core.ContextModel
 * 
 * The aim of this model is to cause the root folder in the hierarchy to be selected when switching to the TodayContext
 * This is done by setting {@link Zarafa.core.ContextModel#defaultFolder}
 */
Zarafa.today.TodayContextModel = Ext.extend(Zarafa.core.ContextModel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			stateful : false
		});
		Zarafa.today.TodayContextModel.superclass.constructor.call(this, config);
	},
	
	/**
	 * Called during the {@link Zarafa.core.Context#disable disabling} of the {@link Zarafa.core.Context context}.
	 * This will {@link #stopSearch stop the search} and clear all data in the {@link #store}.
	 */
	disable : Ext.emptyFn,

	/**
	 * Sets the selected folder list directly.
	 * Fires the {@link #folderchange} event.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord[]} folders selected folders as an array of
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord MAPIFolder} objects.
	 */
	setFolders : Ext.emptyFn,
	
	/**
	 * Returns the default {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} which is
	 * used within the current selection of folders.
	 * @return {Zarafa.hierarchy.data.MAPIFolderRecord} The default folder
	 */
	getDefaultFolder : function()
	{
		if (!this.defaultFolder) {
			var store = container.getHierarchyStore().getDefaultStore();
			if (store) {
				this.defaultFolder = store.getSubtreeFolder();
			}
		}
		return this.defaultFolder;
	}
});
