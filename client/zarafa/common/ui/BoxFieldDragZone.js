Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.BoxFieldDragZone
 * @extends Ext.dd.DragZone
 * @xtype zarafa.boxfielddragzone
 *
 * A {@link Ext.dd.DragZone DragZone} installed on a {@link Zarafa.common.ui.BoxField BoxField}
 * Ensures cooperation between different BoxFields' drag and drop zones in order to enable the dragging
 * of boxes
 */
Zarafa.common.ui.BoxFieldDragZone = Ext.extend(Ext.dd.DragZone, {
	/**
	 * @cfg {Zarafa.common.ui.BoxFieldField} field The field on which this drag zone is installed
	 */
	field : undefined,

	/**
	 * Returns the data object associated with this drag source
	 * Here it contains:
	 * 	- ddel - a drag proxy that follows the mouse
	 *  - sourceEl - original dragged element
	 *  - repairXY - {Number[]} an array of [x, y] coordinates for repairing on illegal drop
	 *  - draggedRecord - the {Zarafa.core.data.IPMRecord} record for the box that is being dragged
	 * 
	 * @param {Ext.EventObject} e The mouse event
	 * @return {Object} data An object containing arbitrary data
	 */
	getDragData : function(e)
	{
		var sourceEl = e.getTarget('.x-zarafa-boxfield-item');
		if (sourceEl) {

			// create box element but in a div instead of li
			var d = Ext.DomHelper.createDom({
				tag : 'div',
				html : sourceEl.innerHTML,
				id : Ext.id(),
				cls : sourceEl.className,
				style : 'display : inline-block'
			});

			// ensure that child nodes have unique ids
			for (var i=0; i < d.childNodes.length; i++) {
				if (d.childNodes[i].id) {
					d.childNodes[i].id = Ext.id();
				}
			}

			return {
				ddel : d,
				sourceEl : sourceEl,
				repairXY : Ext.fly(sourceEl).getXY(),
				draggedRecord : this.field.items.get(sourceEl.id).record
			};
		}
	},

	/**
	 * Called before a repair of an invalid drop to get the XY to animate to. By default returns
	 * the XY of this.dragData.ddel
	 * @param {EventObject} e The mouse up event
	 * @return {Array} The xy location (e.g. [100, 200])
	 */
	getRepairXY : function()
	{
		return this.dragData.repairXY;
	}
});

Ext.reg('zarafa.boxfielddragzone', Zarafa.common.ui.BoxFieldDragZone);
