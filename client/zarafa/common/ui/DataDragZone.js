Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.DataDragZone
 * @extends Ext.dd.DragZone
 *
 * A Special DragZone implemention which
 * can be used on a {@link Ext.DataView DataView}.
 * This is used for example in the
 * {@link Zarafa.common.ui.DraggableDataView}
 */
Zarafa.common.ui.DataDragZone = Ext.extend(Ext.dd.DragZone, {
	/**
	 * The view on which this DragZone is installed
	 * @property
	 * @type Ext.DataView
	 * @private
	 */
	view : undefined,

	/**
	 * The special Element which is displayed when dragging data
	 * over the DragZone.
	 * @property
	 * @type Ext.Element
	 * @private
	 */
	ddel : undefined,

	/**
	 * @constructor
	 * @param {Ext.DataView} view The view on which the DragZone is installed
	 * @param {Object} config Configuration object
	 */
	constructor : function(view, config)
	{
		config = config || {};

		this.view = view;

		Ext.applyIf(config, {
			ddGroup : 'DataDD'
		});

		Zarafa.common.ui.DataDragZone.superclass.constructor.call(this, view.getEl(), config);

		this.ddel = document.createElement('div');
		this.ddel.className = 'x-data-dd-wrap';
	},

	/**
	 * <p>The provided implementation of the getDragData method which collects the data to be dragged from the DataView on mousedown.</p>
	 * <p>This data is available for processing in the {@link Ext.dd.DropZone#onNodeEnter onNodeEnter}, {@link Ext.dd.DropZone#onNodeOver onNodeOver},
	 * {@link Ext.dd.DropZone#onNodeOut onNodeOut} and {@link Ext.dd.DropZone#onNodeDrop onNodeDrop} methods of a cooperating {@link Ext.dd.DropZone DropZone}.</p>
	 * <p>The data object contains the following properties:<ul>
	 * <li><b>view</b> : Ext.DataView<div class="sub-desc">The DataView from which the data is being dragged.</div></li>
	 * <li><b>ddel</b> : htmlElement<div class="sub-desc">An htmlElement which provides the "picture" of the data being dragged.</div></li>
	 * <li><b>rowIndex</b> : Number<div class="sub-desc">The index of the row which receieved the mousedown gesture which triggered the drag.</div></li>
	 * <li><b>selections</b> : Array<div class="sub-desc">An Array of the selected Records which are being dragged from the DataView.</div></li>
	 * </ul></p>
	 * @private
	 */
	getDragData : function(e)
	{
		var node = this.view.findItemFromChild(Ext.lib.Event.getTarget(e));
		if (!node) {
			return;
		}

		var index = this.view.indexOf(node);

		if (index >= 0) {
			// Create a copy of the event object,
			// we need this later in the onInitDrag function
			var origEvent = new Ext.EventObjectImpl(e);

			return {
				view: this.view,
				ddel: this.ddel,
				index: index,
				selections: this.view.getSelectedRecords(),
				origEvent : origEvent
			};
		}

		return false;
	},

	/**
	 * <p>The provided implementation of the onInitDrag method. Sets the <tt>innerHTML</tt> of the drag proxy which provides the "picture"
	 * of the data being dragged.</p>
	 * <p>The <tt>innerHTML</tt> data is found by calling the owning GridPanel's {@link Ext.grid.GridPanel#getDragDropText getDragDropText}.</p>
	 * @param {Number} x The x coordinate from where the dragging started
	 * @param {Number} y The y coordinate from where the dragging started
	 * @private
	 */
	onInitDrag : function(x, e)
	{
		// Check if the dragData contains a origEvent (as initialized by getDragData).
		// If this is present, we have to manually call the onItemClick event handler
		// on the view to ensure that the item we are about to drag is marked as selected.
		//
		// We can't do that in getDragData because of the ordering of the event handlers
		// of both this class as well as the DataView.
		if (this.dragData && this.dragData.origEvent) {
			var index = this.dragData.index;
			var node = this.view.getNode(index);

			if (!this.view.isSelected(index)) {
				this.view.onItemClick(node, index, this.dragData.origEvent);

				// The selection has been changed, update the selections array
				this.dragData.selections = this.view.getSelectedRecords();
			}
			delete this.dragData.origEvent;
		}

		this.ddel.innerHTML = this.view.getDragDropText();
		this.proxy.update(this.ddel);
		// fire start drag?
	},

	/**
	 * An empty immplementation. Implement this to provide behaviour after a repair of an invalid drop. An implementation might highlight
	 * the selected rows to show that they have not been dragged.
	 * @private
	 */
	afterRepair : function()
	{
		this.dragging = false;
	},

	/**
	 * <p>An empty implementation. Implement this to provide coordinates for the drag proxy to slide back to after an invalid drop.</p>
	 * <p>Called before a repair of an invalid drop to get the XY to animate to.</p>
	 * @param {EventObject} e The mouse up event
	 * @return {Array} The xy location (e.g. [100, 200])
	 * @private
	 */
	getRepairXY : function(e, data)
	{
		return false;
	},

	/**
	 * Called when the dragging has ended
	 * @param {Object} data The data which was used during the drag
	 * @param {Ext.EventObject} e The event object
	 * @private
	 */
	onEndDrag : function(data, e)
	{
		// fire end drag?
	},

	/**
	 * Called when an item has been dropped
	 * @param {Ext.dd.DropZone} dd The zone in which the item was dropped
	 * @param {Ext.EventObject} e The event object
	 * @param {String} id The id of the Ext.Element where the item was dropped
	 * @private
	 */
	onValidDrop : function(dd, e, id)
	{
		// fire drag drop?
		this.hideProxy();
	},

	/**
	 * Called when an item has been dropped on an invalid location
	 * @param {Ext.EventObject} e The event object
	 * @param {String} id The id of the Ext.Element where the item was dropped
	 * @private
	 */
	beforeInvalidDrop : function(e, id)
	{
	}
});
