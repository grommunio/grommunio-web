Ext.namespace('Zarafa.common.recipientfield.ui');

/**
 * @class Zarafa.common.recipientfield.ui.RecipientDropZone
 * @extends Zarafa.common.ui.BoxFieldDropZone
 * @xtype zarafa.recipientdropzone
 *
 * A {@link Ext.dd.DropZone DropZone} installed on a {@link Zarafa.common.recipientfield.ui.RecipientField RecipientField}
 * Ensures cooperation between different RecipientFields' drag and drop zones in order to enable the dragging
 * of recipients e.g. from the TO to the CC field of an e-mail.
 */
Zarafa.common.recipientfield.ui.RecipientDropZone = Ext.extend(Zarafa.common.ui.BoxFieldDropZone, {
	/**
	 * Called when the DropZone determines that a {@link Ext.dd.DragSource} has been dropped onto
	 * the drop node.
	 * Check if the dragged record is of a different recipient type than the current field's, and change it if it is.
	 * In this case return true to prevent drop repair, false otherwise.
	 * 
	 * @param {Object} nodeData The custom data associated with the drop node (this is the same value returned from
	 * {@link #getTargetFromEvent} for this node)
	 * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
	 * @param {Event} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @return {Boolean} True if the drop was valid, else false
	 */
	onNodeDrop : function(nodeData, dd, e, data)
	{
		if (!this.isValidDropPoint(nodeData, dd, e, data)) {
			return false;
		}

		// If dragging to a field with a different store - e.g. from FROM to TO
		if (dd.field.boxStore !== this.field.boxStore) {
			// recipient_type is between the remove and add, otherwise the box may flicker in the wrong field
			dd.field.boxStore.remove(data.draggedRecord);
			if (this.field.defaultRecipientType) {
				data.draggedRecord.set('recipient_type', this.field.defaultRecipientType);
			}

			this.field.boxStore.add(data.draggedRecord);
			return true;

		} else {
			if (data.draggedRecord.get('recipient_type') === this.field.defaultRecipientType) {
				return false;
			}

			data.draggedRecord.set('recipient_type', this.field.defaultRecipientType);
			return true;
		}
	},

	/**
	 * Called while the DropZone determines that a {@link Ext.dd.DragSource} is over a drop node
	 * that has either been registered or detected by a configured implementation of {@link #getTargetFromEvent}.
	 * Overriden to use {@link #isValidDropPoint}
	 * 
	 * @param {Object} nodeData The custom data associated with the drop node (this is the same value returned from
	 * {@link #getTargetFromEvent} for this node)
	 * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
	 * @param {Event} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @return {String} status The CSS class that communicates the drop status back to the source so that the
	 * underlying {@link Ext.dd.StatusProxy} can be updated
	 * @override
	 */
	onNodeOver : function(target, dd, e, data)
	{
		return this.isValidDropPoint(target, dd, e, data) ? Ext.dd.DropZone.prototype.dropAllowed : Ext.dd.DropZone.prototype.dropNotAllowed;
	},

	/**
	 * Determines whether this dropzone allows dropping at this moment
	 * This implementation checks whether the boxLimit has been exceeded
	 * 
	 * @param {Object} nodeData The custom data associated with the drop node (this is the same value returned from
	 * {@link #getTargetFromEvent} for this node)
	 * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
	 * @param {Event} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @return {Boolean} isValid A boolean indicating whether the DropZone allows dropping
	 */
	isValidDropPoint : function(target, dd, e, data)
	{
		return (!this.field.boxLimit || this.field.items.getCount() < this.field.boxLimit);
	}
});

Ext.reg('zarafa.recipientdropzone', Zarafa.common.recipientfield.ui.RecipientDropZone);
