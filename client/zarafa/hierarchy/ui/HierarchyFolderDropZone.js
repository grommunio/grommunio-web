Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.HierarchyFolderDropZone
 * @extends Zarafa.hierarchy.ui.HierarchyTreeDropZone
 *
 * Specialized {@link Ext.tree.TreeDropZone Drop Zone} which
 * is used for dragging and dropping {@link Zarafa.hierarchy.data.MAPIFolderRecord folders}
 * in the {@link Zarafa.hierarchy.ui.HierarchyTreePanel Hierarchy Tree}.
 */
Zarafa.hierarchy.ui.HierarchyFolderDropZone = Ext.extend(Zarafa.hierarchy.ui.HierarchyTreeDropZone, {

	/**
	 * @constructor
	 * @param {String/HTMLElement/Element} tree The {@link Ext.tree.TreePanel} for which to enable dropping
	 * @param {Object} config
	 */
	constructor : function(tree, config)
	{
		Zarafa.hierarchy.ui.HierarchyFolderDropZone.superclass.constructor.call(this, tree, config);

		if (this.tree) {
			this.tree.on('beforenodedrop', this.onBeforeNodeDrop, this);
		}
	},

	/**
	 * Event handler for the {@link Ext.tree.TreePanel#beforenodedrop 'beforenodedrop'}
	 * event which is fired just before a node is being dropped. This will check if we
	 * are dropping the folder on the same parent as it is currently in already. When
	 * this happens we cancel the drop. This ensures that the UI will complete the drop
	 * just as if everything worked as expected.
	 *
	 * @param {Object} dropEvent The event object which describes what node is being
	 * dropped where.
	 * @private
	 */
	onBeforeNodeDrop : function(dropEvent)
	{
		// Multiple DropZones might have been installed on the Tree,
		// check if this event is coming from this class.
		if (dropEvent.source !== this) {
			return;
		}

		var dropNode = dropEvent.dropNode;

		if (Ext.isDefined(dropNode)) {
			var targetNode = dropEvent.target;

			switch (dropEvent.point) {
				case 'above':
				case 'below':
					targetNode = targetNode.parentNode;
					break;
				case 'append':
				/* falls through */
				default:
					break;
			}

			// Is dropped on same parent, cancel drop event
			if (dropNode.parentNode === targetNode) {
				return false;
			}
		}
	},

	/**
	 * Obtain the DropPoint string ('above', 'append' and 'below') which
	 * indicate at which position we are currently dragging the object
	 * over the current node.
	 *
	 * This code is copied from the superclass, with the only exception
	 * that it will allow the 'append' string even though the folder
	 * over which we are hovering is a leaf node.
	 *
	 * @param {Ext.EventObj} e The Event Object used for dragging the item
	 * @param {Object} n The object which describes the node over which
	 * the item is being hovered
	 * @parmam {Ext.tree.TreeDragZone} dd The DragZone which is used
	 * for draging the current item
	 * @private
	 */
	getDropPoint : function(e, n, dd)
	{
		var tn = n.node;

		if (tn.isRoot) {
			return tn.allowChildren !== false ? 'append' : false; // always append for root
		}
		var dragEl = n.ddel;
		var t = Ext.lib.Dom.getY(dragEl), b = t + dragEl.offsetHeight;
		var y = Ext.lib.Event.getPageY(e);
		var noAppend = tn.allowChildren === false;
		if (this.appendOnly || tn.parentNode.allowChildren === false) {
			return noAppend ? false : 'append';
		}
		var noBelow = false;
		if (!this.allowParentInsert) {
			noBelow = tn.hasChildNodes() && tn.isExpanded();
		}
		var q = (b - t) / (noAppend ? 2 : 3);
		if (y >= t && y < (t + q)) {
			return 'above';
		} else if (!noBelow && (noAppend || y >= b-q && y <= b)) {
			return 'below';
		} else {
			return 'append';
		}
	},

	/**
	 * Function which return false when the dragged record is hovering over
	 * the {@link Zarafa.hierarchy.data.MAPIFolderRecord#getFavoritesRootFolder Favorites} root folder or
	 * {@link Zarafa.hierarchy.data.MAPIFolderRecord#isFavoritesFolder favorite} marked folder.
	 *
	 * @param {Object} n The object which describes the node over which
	 * the item is being hovered
	 * @param {String} pt The DropPoint (see {@link #getDropPoint}).
	 * @param {Ext.tree.TreeDragZone} dd The DragZone which is used
	 * for dragging the current item
	 * @param {Ext.EventObject} e The Event Object used for dropping the item
	 * @param {Object} data The data object describing the {@link Zarafa.hierarchy.ui.FolderNode folder} node Item which
	 * are being dragged
	 * @private
	 */
	isValidDropPoint : function(n, pt, dd, e, data)
	{
		var folder = n.node.getFolder();
		if (folder.isFavoritesFolder() || folder.isFavoritesRootFolder() || folder.isTodoListFolder()) {
			return false;
		}
		return Zarafa.hierarchy.ui.HierarchyFolderDropZone.superclass.isValidDropPoint.apply(this, arguments);
	}
});
