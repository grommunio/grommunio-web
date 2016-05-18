Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.GridDragZone
 * @extends Ext.grid.GridDragZone
 *
 * Extension of the default GridDragZone which
 * contains a fix for selecting or deselecting
 * rows from the Grid when Drag&Drop is enabled.
 */
Zarafa.common.ui.grid.GridDragZone = Ext.extend(Ext.grid.GridDragZone, {

	/**
	 * Obtain a data object containing the Drag information.
	 *
	 * This is inherited from the {@link Ext.grid.GridDragZone superclass},
	 * and does the same except that it will not call {@link Ext.grid.RowSelectionModel#handleMouseDown}.
	 * This action is deferred to the {@link #onMouseUp} event handler.
	 *
	 * <li><b>grid</b> : Ext.Grid.GridPanel<div class="sub-desc">The GridPanel from which the data is being dragged.</div></li>
	 * <li><b>ddel</b> : htmlElement<div class="sub-desc">An htmlElement which provides the "picture" of the data being dragged.</div></li>
	 * <li><b>rowIndex</b> : Number<div class="sub-desc">The index of the row which receieved the mousedown gesture which triggered the drag.</div></li>
	 * <li><b>selections</b> : Array<div class="sub-desc">An Array of the selected Records which are being dragged from the GridPanel.</div></li>
	 * </ul></p>
	 */
	getDragData : function(e)
	{
		var t = Ext.lib.Event.getTarget(e);
		var rowIndex = this.view.findRowIndex(t);
		if (rowIndex !== false) {
			var sm = this.grid.selModel;

			// Create a copy of the event object,
			// we need this later in the onInitDrag function
			var origEvent = new Ext.EventObjectImpl(e);

			return {
				grid: this.grid,
				ddel: this.ddel,
				rowIndex: rowIndex,
				selections: sm.getSelections(),
				origEvent : origEvent
			};
		}
		return false;
	},

	/**
	 * Called when the user starts dragging, this is always called after {@link #getDragData} (which
	 * is called when the user presses the mouse). This will check if the {@link #dragData} contains
	 * the 'origEvent' field. If so, it will call {@link Ext.grid.RowSelectionModel#handleMouseDown}
	 * to update our selection just before dragging.
	 *
	 * @param {Number} x The X coordinate from where we start dragging
	 * @param {Number} y The Y coordinate from where we start dragging
	 */
	onInitDrag : function(x, y)
	{
		// Check if the dragData contains a origEvent (as initialized by getDragData).
		// If this is present, we have to manually call the onItemClick event handler
		// on the view to ensure that the item we are about to drag is marked as selected.
		//
		// We can't do that in getDragData because of the ordering of the event handlers
		// of both this class as well as the DataView.
		var data = this.dragData;
		if (data && data.origEvent) {
			var sm = this.grid.selModel;

			if (!sm.isSelected(data.rowIndex)) {
				sm.handleMouseDown(this.grid, data.rowIndex, data.origEvent);

				// The selection has been changed, update the selections array
				data.selections = sm.getSelections();
			}

			delete this.dragData.origEvent;
		}

		Zarafa.common.ui.grid.GridDragZone.superclass.onInitDrag.apply(this, arguments);
	},

	/**
	 * Event handler that fires when a drag/drop obj gets a mouseup
	 *
	 * When the {@link #dragData} still contains the 'origEvent' field, then this
	 * function was called without that anything has been dragged (normally 'origEvent')
	 * is cleared in {@link #onInitDrag}. In this case we call {@link Ext.grid.RowSelectionModel#handleMouseDown}
	 * to update the selection inside the grid.
	 *
	 * @param {Event} e the mouseup event
	 */
	onMouseUp : function(e)
	{
		var data = this.dragData;

		// If the dragData still contains the origEvent, then onInitDrag has not been
		// called which means the user only clicked on the row and we must update
		// our selection.
		if (data && data.origEvent) {
			data.grid.selModel.handleMouseDown(data.grid, data.rowIndex, data.origEvent);
			delete data.origEvent;
		}

		Zarafa.common.ui.grid.GridDragZone.superclass.onMouseUp.apply(this, arguments);
	}
});
