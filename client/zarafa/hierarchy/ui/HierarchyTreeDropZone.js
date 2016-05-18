Ext.namespace('Zarafa.hierarchy.ui');

/**
 * @class Zarafa.hierarchy.ui.HierarchyTreeDropZone
 * @extends Ext.tree.TreeDropZone
 *
 * Specialized {@link Ext.tree.TreeDropZone Drop Zone} which
 * is used for dragging and dropping over the {@link Zarafa.hierarchy.ui.HierarchyTreePanel Hierarchy Tree}.
 * This adds support for changing the icon depending if the Ctrl-key has been pressed.
 */
Zarafa.hierarchy.ui.HierarchyTreeDropZone = Ext.extend(Ext.tree.TreeDropZone, {
	/**
	 * @cfg {String} The CSS class returned to the drag source when drop is allowed 
	 * while the user has the Ctrl-key pressed (defaults to "x-dd-drop-ok-add").
	 */
	dropAllowedAdd : 'x-dd-drop-ok-add',

	/**
	 * Called when the DropZone determines that a {@link Ext.dd.DragSource} has entered a drop node
	 * that has either been registered or detected by a configured implementation of
	 * {@link #getTargetFromEvent}.
	 * @param {Ext.Element} target The custom data associated with the drop node (as returned from {@link #getTargetFromEvent}.
	 * @param {Ext.dd.DragSource} The drag source that was dragged over this drop zone
	 * @param {Ext.EventObject} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @protected
	 */
	onNodeEnter : function(target, dd, e, data)
	{
		// Change the function from the prototype to update the scope of the function.
		// This is needed to ensure we can call removeEventListener again with the correct
		// function reference later.
		this.onDragKeyDown = Zarafa.hierarchy.ui.HierarchyTreeDropZone.prototype.onDragKeyDown.createDelegate({ dd : dd, dz : this });
		this.onDragKeyUp = Zarafa.hierarchy.ui.HierarchyTreeDropZone.prototype.onDragKeyUp.createDelegate({ dd : dd, dz : this });

		// During dragging (onNodeOver) we either apply dropAllowed or dropAllowedAdd based on the Ctrl-key,
		// if the user didn't drag but just presses the button we must also update the icon. For that we
		// have these 2 event handlers.
		Ext.EventManager.on(Ext.getDoc(), 'keydown', this.onDragKeyDown, this);
		Ext.EventManager.on(Ext.getDoc(), 'keyup', this.onDragKeyUp, this);

		return Zarafa.hierarchy.ui.HierarchyTreeDropZone.superclass.onNodeEnter.apply(this, arguments);
	},

	/**
	 * Called while the DropZone determines that a {@link Ext.dd.DragSource} is being dragged over it,
	 * but not over any of its registered drop nodes.
	 * @param {Ext.dd.DragSource} source The drag source that was dragged over this drop zone
	 * @param {Event} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @return {String} status The CSS class that communicates the drop status back to the source so that the
	 * underlying {@link Ext.dd.StatusProxy} can be updated
	 * @protected
	 */
	onContainerOver : function(dd, e, data)
	{
		var ret = Zarafa.hierarchy.ui.HierarchyTreeDropZone.superclass.onContainerOver.apply(this, arguments);

		// If the Ctrl-key is pressed, return dropAllowedAdd to
		// have the correct icon displayed which represents a copy
		// rather then a move.
		if (ret === this.dropAllowed && e.ctrlKey) {
			ret = this.dropAllowedAdd;
		}
		
		return ret;
	},

	/**
	 * Called while the DropZone determines that a {@link Ext.dd.DragSource} is over a drop node that
	 * has either been registered or detected by a configured implementation of {@link #getTargetFromEvent}.
	 * @param {Ext.Element} target The custom data associated with the drop node (as returned from {@link #getTargetFromEvent}.
	 * @param {Ext.dd.DragSource} The drag source that was dragged over this drop zone
	 * @param {Ext.EventObject} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @protected
	 */
	onNodeOver : function(n, dd, e, data)
	{
		var ret = Zarafa.hierarchy.ui.HierarchyTreeDropZone.superclass.onNodeOver.apply(this, arguments);

		// If the Ctrl-key is pressed, return the pecial class
		// to have the correct icon displayed which represents
		// a copy rather then a move.
		if (e.ctrlKey) {
			if (ret === 'x-tree-drop-ok-append') {
				ret = 'x-tree-drop-ok-append-add';
			} else if (ret === 'x-tree-drop-ok-above') {
				ret = 'x-tree-drop-ok-above-add';
			} else if (ret === 'x-tree-drop-ok-between') {
				ret = 'x-tree-drop-ok-between-add';
			} else if (ret === 'x-tree-drop-ok-below') {
				ret = 'x-tree-drop-ok-below-add';
			}
		}
		
		return ret;
	},

	/**
	 * Called when the DropZone determines that a {@link Ext.dd.DragSource} has been dragged
	 * out of the drop node without dropping.
	 * @param {Ext.Element} target The custom data associated with the drop node (as returned from {@link #getTargetFromEvent}.
	 * @param {Ext.dd.DragSource} The drag source that was dragged over this drop zone
	 * @param {Ext.EventObject} e The event
	 * @param {Object} data An object containing arbitrary data supplied by the drag source
	 * @protected
	 */
	onNodeOut : function(target, dd, e, data)
	{
		// Clear event handlers again
		Ext.EventManager.un(Ext.getDoc(), 'keydown', this.onDragKeyDown, this);
		Ext.EventManager.un(Ext.getDoc(), 'keyup', this.onDragKeyUp, this);

		return Zarafa.hierarchy.ui.HierarchyTreeDropZone.superclass.onNodeOut.apply(this, arguments);
	},

	/**
	 * Event handler which is fired when the user presses a key, this is registered during {@link #onNodeEnter}
	 * and will be released in {@link #onNodeOut} and {@link #onNodeDrop}. When the user presses the Ctrl-key
	 * and the user is allowed to drop the item on this DropZone, we update the icon to {@link #dropAllowedAdd}
	 * to visualize the action will be a copy rather then a move.
	 *
	 * NOTE: This function is called using a special scope. 'this' is an object containing 2 fields,
	 * 'dd' which is the DragZone from where the item is dragged and 'dz' which is the DragZone over which
	 * the item is hovering.
	 *
	 * @param {Ext.EventObject} e The event
	 * @private
	 */
	onDragKeyDown : function(e)
	{
		if (e.ctrlKey || e.keyCode === Ext.EventObject.CONTROL) {
			if (this.dd.proxy.dropStatus === this.dz.dropAllowed) {
				this.dd.proxy.setStatus(this.dz.dropAllowedAdd);
			} else if (this.dd.proxy.dropStatus === 'x-tree-drop-ok-append') {
				this.dd.proxy.setStatus('x-tree-drop-ok-append-add');
			} else if (this.dd.proxy.dropStatus === 'x-tree-drop-ok-above') {
				this.dd.proxy.setStatus('x-tree-drop-ok-above-add');
			} else if (this.dd.proxy.dropStatus === 'x-tree-drop-ok-between') {
				this.dd.proxy.setStatus('x-tree-drop-ok-between-add');
			} else if (this.dd.proxy.dropStatus === 'x-tree-drop-ok-below') {
				this.dd.proxy.setStatus('x-tree-drop-ok-below-add');
			}
		}
	},

	/**
	 * Event handler which is fired when the user releases a key, this is registered during {@link #onNodeEnter}
	 * and will be released in {@link #onNodeOut} and {@link #onNodeDrop}. When the user releases the Ctrl-key
	 * and the current dropStatus is {@link #dropAllowedAdd} we change it back to {@link #dropAllowed} to visualize
	 * that the action will be a moved.
	 *
	 * NOTE: This function is called using a special scope. 'this' is an object containing 2 fields,
	 * 'dd' which is the DragZone from where the item is dragged and 'dz' which is the DragZone over which
	 * the item is hovering.
	 *
	 * @param {Ext.EventObject} e The event
	 * @private
	 */
	onDragKeyUp : function(e)
	{
		if (e.ctrlKey || e.keyCode === Ext.EventObject.CONTROL) {
			if (this.dd.proxy.dropStatus === this.dz.dropAllowedAdd) {
				this.dd.proxy.setStatus(this.dz.dropAllowed);
			} else if (this.dd.proxy.dropStatus === 'x-tree-drop-ok-append-add') {
				this.dd.proxy.setStatus('x-tree-drop-ok-append');
			} else if (this.dd.proxy.dropStatus === 'x-tree-drop-ok-above-add') {
				this.dd.proxy.setStatus('x-tree-drop-ok-above');
			} else if (this.dd.proxy.dropStatus === 'x-tree-drop-ok-between-add') {
				this.dd.proxy.setStatus('x-tree-drop-ok-between');
			} else if (this.dd.proxy.dropStatus === 'x-tree-drop-ok-below-add') {
				this.dd.proxy.setStatus('x-tree-drop-ok-below');
			}
		}
	}
});
