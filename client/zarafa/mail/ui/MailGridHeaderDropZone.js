Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailGridHeaderDropZone
 * @extends Ext.grid.HeaderDropZone
 */
Zarafa.mail.ui.MailGridHeaderDropZone = Ext.extend(Ext.grid.HeaderDropZone, {

	/**
	 * Event handler triggered when node over the grid header.
	 *
	 * @param {Ext.Element} n The node element which is drag and drop.
	 * @param {Ext.dd.DD} dd A DragDrop implementation where the linked element follows the mouse cursor during a drag.
	 * @param {Ext.EventObject} e The event object.
	 * @param {Object} data The data object which contains the {@link Ext.Element header}.
	 * @returns {string} return either "x-dd-drop-ok" or "x-dd-drop-nodrop".
	 */
	onNodeOver: function(n, dd, e, data)
	{
		var result = Zarafa.mail.ui.MailGridHeaderDropZone.superclass.onNodeOver.apply(this, arguments);

		var h = data.header;
		var view = this.view;

		var oldIndex = view.getCellIndex(h);
		var newIndex = view.getCellIndex(n);
		var cm = this.grid.colModel;

		var oldCol = cm.getColumnAt(oldIndex);
		var newCol = cm.getColumnAt(newIndex);

		var pt = this.getAppendPosition(n, e);

		if ((oldCol.preventColSwitch === true ||
			newCol.preventColSwitch === true ||
			this.isColAllowSwitch(n, pt === "after" ? "nextVisible" : "prevVisible") === false)
		) {
			return this.dropNotAllowed;
		}

		return result;
	},

	/**
	 * Helper function which used to check {@link Ext.Element header} should allow to switch if
	 * next/previous visible column is not 'preventColSwitch' true.
	 *
	 * @param {Ext.Element} n The node element which is drag and drop.
	 * @param {string} checkVisibleFn The handler name which used to get next/previous visible column.
	 * @returns {boolean} True to allow the header column to switch else false.
	 */
	isColAllowSwitch: function(n, checkVisibleFn)
	{
		if (Ext.isEmpty(checkVisibleFn) || (checkVisibleFn !== 'nextVisible' && checkVisibleFn !== 'prevVisible')) {
			console.error("checkVisibleFn should be either 'nextVisible' or 'prevVisible'.");
			return false;
		}

		var cm = this.grid.colModel;
		var view = this.view;

		var colVisibleIndex = view.getCellIndex(this[checkVisibleFn](n));

		if (colVisibleIndex === false) {
			return false;
		}

		var visibleCol = cm.getColumnAt(colVisibleIndex);
		if (visibleCol.preventColSwitch === true){
			return false;
		}

		return true;
	},

	/**
	 * Override function to get the previous visible element.
	 *
	 * @param {Ext.Element} h The element which previous visible we need to find.
	 * @returns {Ext.Element | null} element if there is some previous visible else Null.
	 */
	prevVisible: function(h)
	{
		var v = this.view, cm = this.grid.colModel;
		h = h.previousSibling;
		while(h){
			if(!cm.isHidden(v.getCellIndex(h))){
				return h;
			}
			h = h.previousSibling;
		}
		return null;
	},

	/**
	 * Helper function used to get the position where column is
	 * append before/after the header column.
	 *
	 * @param {Ext.Element} n The node element which is drag and drop.
	 * @param {Ext.dd.DD} dd A DragDrop implementation where the linked element follows the mouse cursor during a drag.
	 * @returns {string}
	 */
	getAppendPosition: function(n, e)
	{
		var x = Ext.lib.Event.getPageX(e),
			r = Ext.lib.Dom.getRegion(n.firstChild);

		return (r.right - x) <= ((r.right-r.left)/2) ? "after" : "before";
	},

	/**
	 * Event handler called when node is drop somewhere in grid header. It will check
	 * column is marked 'preventColSwitch' or next/previous visible column are not marked as a 'preventColSwitch'
	 * then dont allow to switch that column.
	 *
	 * @param {Ext.Element} n The node element which is drag and drop.
	 * @param {Ext.dd.DD} dd A DragDrop implementation where the linked element follows the mouse cursor during a drag.
	 * @param {Ext.EventObject} e The event object.
	 * @param {Object} data The data object which contains the {@link Ext.Element header}.
	 * @returns {boolean} True to allow node to drop else false.
	 */
	onNodeDrop: function(n, dd, e, data)
	{
		var h = data.header;
		if(h != n){
			var cm = this.grid.colModel,
				pt = this.getAppendPosition(n, e),
				oldIndex = this.view.getCellIndex(h),
				newIndex = this.view.getCellIndex(n);

			var oldCol = cm.getColumnAt(oldIndex);
			var newCol = cm.getColumnAt(newIndex);

			if (oldCol.preventColSwitch === true ||
				newCol.preventColSwitch === true ||
				this.isColAllowSwitch(n, pt === "after" ? "nextVisible" : "prevVisible") === false) {
				return false;
			}

			if(pt == "after"){
				newIndex++;
			}

			if(oldIndex < newIndex){
				newIndex--;
			}

			cm.moveColumn(oldIndex, newIndex);
			return true;
		}
		return false;
	}
});
