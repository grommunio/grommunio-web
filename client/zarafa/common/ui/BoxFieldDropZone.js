Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.BoxFieldDropZone
 * @extends Ext.dd.DropZone
 * @xtype zarafa.boxfielddropzone
 *
 * A {@link Ext.dd.DropZone DropZone} installed on a {@link Zarafa.common.ui.BoxField BoxField}
 * Ensures cooperation between different BoxFields' drag and drop zones in order to enable the dragging
 * of boxes
 */
Zarafa.common.ui.BoxFieldDropZone = Ext.extend(Ext.dd.DropZone, {
	/**
	 * @cfg {Zarafa.common.ui.BoxField} field The field on which this drag zone is installed
	 */
	field : undefined,

	/**
	 * Returns a custom data object associated with the DOM node that is the target of the event.
	 * @param {Event} e The event
	 * @return {Object} data The custom data
	 */
	getTargetFromEvent : function(e)
	{
		return e.getTarget('.x-zarafa-boxfield');
	},

	/**
	 * Called when the DropZone determines that a {@link Ext.dd.DragSource} has entered a drop node
	 * that has either been registered or detected by a configured implementation of {@link #getTargetFromEvent}.
	 * Override highlights the drop field, adding wrapFocusClass to it.
	 * 
	 * @param {Object} nodeData The custom data associated with the drop node (this is the same value returned from 
	 * {@link #getTargetFromEvent} for this node)
	 * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
	 * @param {Event} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 */
	onNodeEnter : function(target, dd, e, data)
	{
		Ext.get(target).addClass(this.wrapFocusClass);
	},

	/**
	 * Called when the DropZone determines that a {@link Ext.dd.DragSource} has been dragged out of
	 * the drop node without dropping.
	 * Override removes the focus class, 'unhighlighting' the field.
	 * 
	 * @param {Object} nodeData The custom data associated with the drop node (this is the same value returned from
	 * {@link #getTargetFromEvent} for this node)
	 * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
	 * @param {Event} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 */
	onNodeOut : function(target , dd, e, data)
	{
		Ext.get(target).removeClass(this.wrapFocusClass);
	},

	/**
	 * Called while the DropZone determines that a {@link Ext.dd.DragSource} is over a drop node
	 * that has either been registered or detected by a configured implementation of {@link #getTargetFromEvent}.
	 * The default implementation returns this.dropNotAllowed, so it should be
	 * overridden to provide the proper feedback.
	 * @param {Object} nodeData The custom data associated with the drop node (this is the same value returned from
	 * {@link #getTargetFromEvent} for this node)
	 * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
	 * @param {Event} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @return {String} status The CSS class that communicates the drop status back to the source so that the
	 * underlying {@link Ext.dd.StatusProxy} can be updated
	 */
	onNodeOver : function(target, dd, e, data)
	{
		return Ext.dd.DropZone.prototype.dropAllowed;
	}
});

Ext.reg('zarafa.boxfielddropzone', Zarafa.common.ui.BoxFieldDropZone);
