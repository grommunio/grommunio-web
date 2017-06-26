Ext.namespace('Zarafa.advancesearch.ui');

/**
 * @class Zarafa.advancesearch.ui.SearchFolderContextMenu
 * @extends Zarafa.core.ui.menu.ConditionalMenu
 * @xtype zarafa.searchfoldercontextmenu
 */
Zarafa.advancesearch.ui.SearchFolderContextMenu = Ext.extend(Zarafa.core.ui.menu.ConditionalMenu, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items : [{
				xtype: 'zarafa.conditionalitem',
				text : _('Delete search folder'),
				iconCls : 'icon_folder_delete',
				handler : this.onContextItemDeleteFolder,
				scope : this
			}]
		});

		Zarafa.advancesearch.ui.SearchFolderContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler triggers when "Delete search folder" button was clicked.
	 * it is used to delete the search folder which marked as favorites.
	 */
	onContextItemDeleteFolder : function ()
	{
		var record = this.records;
		var store = record.getStore();
		store.remove(record);
		record.removeFromFavorites();
		store.save(record);
	}
});

Ext.reg('zarafa.searchfoldercontextmenu', Zarafa.advancesearch.ui.SearchFolderContextMenu);
