Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.TreeSorter
 * @extends Ext.tree.TreeSorter
 *
 * Special sorting class for the HierarchyTree, this enables special sorting of the folders,
 * in which the "Stores" are sorted in such a way that the Private store is placed on top,
 * and the Public store is placed on the bottom. All Shared stores are placed alphabetical
 * order between the Private and Public stores.
 * All folders below the stores are sorted in alphabetical order.
 */
Zarafa.hierarchy.ui.TreeSorter = Ext.extend(Ext.tree.TreeSorter, {

	/**
	 * @cfg {Boolean} folderStore
	 * @hide
	 */
	/**
	 * @cfg {String} property
	 * @hide
	 */
	/**
	 * @cfg {String} leadAttr
	 * @hide
	 */
	/**
	 * @cfg {Function} sortType
	 * @hide
	 */

	/**
	 * @cfg {String} folderProperty The property from the {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
	 * which must be used in the comparison between 2 {@link Zarafa.hierarchy.data.MAPIFolderRecord folders}.
	 */
	folderProperty : 'display_name',

	/**
	 * @cfg {String} storeProperty The property from the {@link Zarafa.hierarchy.data.MAPIStoreRecord store}
	 * which must be used in the comparison between 2 {@link Zarafa.hierarchy.data.MAPIStoreRecord stores}.
	 */
	storeProperty : 'mailbox_owner_name',
	
	/**
	 * @cfg {String[]} folderOrder The predefined order for the folders in the hierarchy. It contains default 
	 * folder keys and container classes.
	 */
	folderOrder : [
		'inbox', 
		'drafts', 
		'outbox', 
		'sent', 
		'IPF.Note', 
		'wastebasket', 
		'junk', 
		'calendar', 
		'IPF.Appointment', 
		'contact', 
		'IPF.Contact', 
		'task', 
		'IPF.Task', 
		'note', 
		'IPF.StickyNote', 
		'journal', 
		'IPF.Journal', 
		'IPF.Note.OutlookHomepage'
	],

	/**
	 * @constructor
	 * @param {Ext.tree.Tree} tree The tree which this sorter is being applied on
	 * @param {Object} config Configuration object
	 */
	constructor : function(tree, config)
	{
		Zarafa.hierarchy.ui.TreeSorter.superclass.constructor.apply(this, arguments);

		this.sortFn = this.hierarchySort.createDelegate(this);
	},

	/**
	 * Special sorting function which applies special sorting when the
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord folder} on the node
	 * is a {@link Zarafa.hierarchy.data.MAPIFolderRecord#isIPMSubTree IPM_SUBTREE}.
	 *
	 * @param {Ext.tree.Node} node1 The first node to be compared
	 * @param {Ext.tree.Node} node2 The second node to be compared
	 * @private
	 */
	hierarchySort : function(node1, node2)
	{
		var folder1 = node1.attributes.folder;
		var folder2 = node2.attributes.folder;
		var store1 = folder1.getMAPIStore();
		var store2 = folder2.getMAPIStore();

		var dsc = this.dir && this.dir.toLowerCase() == "desc";
		var cs = this.caseSensitive === true;

		// If folder 1 is the root node (IPM_SUBTREE) for the
		// default store we directly return a value to sort it
		// to the top of the tree. For the public store we return
		// a value to sort it to the bottom of the tree.
		if (folder1.isIPMSubTree()) {
			if (store1.isDefaultStore()) {
				return dsc ? +1 : -1;
			}
			if (store1.isPublicStore()) {
				return dsc ? -1 : +1;
			}
		}

		// If folder 2 is the root node (IPM_SUBTREE) for the
		// default store we directly return a value to sort it
		// to the top of the tree. For the public store we return
		// a value to sort it to the bottom of the tree.
		if (folder2.isIPMSubTree()) {
			if (store2.isDefaultStore()) {
				return dsc ? -1 : +1;
			}

			if (store2.isPublicStore()) {
				return dsc ? +1 : -1;
			}
		}

		// If both folder 1 as folder 2 are root nodes (IPM_SUBTREE) then
		// we sort by the storeProperty, allowing the sorting based on
		// the display name of the user, rather then of the folder.
		if (folder1.isIPMSubTree() && folder2.isIPMSubTree()) {
			var cmp = this.compareRecordProp(store1, store2, this.storeProperty, dsc, cs);
			// If the store properties are equal, then we have 2 shared folders which
			// belong to the same store. We are going to sort those by the folderProperty.
			if (cmp !== 0) {
				return cmp;
			}
		}

		// Sort all remaining cases by the folder property.
		return this.compareRecordProp(folder1, folder2, this.folderProperty, dsc, cs);
	},

	/**
	 * Helper function for {@link #hierarchySort}, this performs a comparison of two records.
	 * The records (folders) will be ordered based on the preset folder order defined in
	 * {@link folderOrder}. If this will not result in a order, the records will be ordered
	 * based on the on a passed property field.
	 *
	 * @param {Ext.data.Record} record1 The first record to compare
	 * @param {Ext.data.Record} record2 The second record to compare
	 * @param {String} property The property on which the records are compared
	 * @param {Boolean} descending True if the records must be sorted descending
	 * @param {Boolean} caseSensitive True if the property values must be compared case-sensitive
	 * @return {Integer} +1 if record1 should be placed before record 2 in the order, -1 otherwise
	 * @private
	 */
	compareRecordProp : function(record1, record2, property, descending, caseSensitive)
	{
		// First look at the folders types, because they have a predefined order
		var folderKey1 = record1.getDefaultFolderKey();
		var folderKey2 = record2.getDefaultFolderKey();

		// If the folder is not a default folder, we will sort it by its container class
		if ( !folderKey1 ){
			folderKey1 = record1.get('container_class');
		}
		if ( !folderKey2 ){
			folderKey2 = record2.get('container_class');
		}

		// First check if record1 or record2 are a different default type or type
		// and if so, sort the records based on that 
		var index1 = this.folderOrder.indexOf(folderKey1);
		var index2 = this.folderOrder.indexOf(folderKey2);
		if ( index1 > -1 ){
			if ( index2===-1 || index1<index2 ){
				return descending ? +1 : -1;
			}else if ( index1 > index2 ) {
				return descending ? -1 : +1;
			}
		}else if ( index2 > -1 ){
			return descending ? -1 : +1;
		}
		
		// Folders that have the same type will now be sorted based on the passed property
		
		// For case insensitive sorting, convert to lowercase, this will correctly position
		// folders which start with '_' to be sorted first (when converting to uppercase, those
		// folders are otherwise sorted last.
		var v1 = record1.get(property);
		var v2 = record2.get(property);
		if (!caseSensitive) {
			v1 = !Ext.isEmpty(v1) ? v1.toLowerCase() : v1;
			v2 = !Ext.isEmpty(v2) ? v2.toLowerCase() : v2;
		}

		if (v1 < v2) {
			return descending ? +1 : -1;
		} else if(v1 > v2) {
			return descending ? -1 : +1;
		} else {
			return 0;
		}
	}
});
