(function() {
	/*
	 * Fix the Ext.dd.DragSource, so that it uses the Ext.dd.DragDropMgr.getGroupDDById
	 * to find the correct DropZone class for the given id. ExtJs does support
	 * registering multiple zones to an id, but the DragSource doesn't handle
	 * that case since it would always return the first dropZone which the
	 * DragDropMgr would return (the one with a ddGroup name which is
	 * alphabetical the highest).
	 */
	var orig_onDragEnter = Ext.dd.DragSource.prototype.onDragEnter;
	var orig_onDragOver = Ext.dd.DragSource.prototype.onDragOver;
	var orig_onDragOut = Ext.dd.DragSource.prototype.onDragOut;
	var orig_onDragDrop = Ext.dd.DragSource.prototype.onDragDrop;

	Ext.override(Ext.dd.DragSource, {
		onDragEnter : function(e, id)
		{
			// If we still have a cached target, then we still have
			// a connection with a DropZone which we should now force
			// to disconnect using onDragOut(). This prevents that we
			// are dragging the same item over 2 dragzones at the same
			// time.
			if (this.cachedTarget) {
				var oldId = this.cachedTarget.id;

				this.onDragOut(e, oldId);
			}

			var target;
			if (this.ddGroup) {       
				target = Ext.dd.DragDropMgr.getGroupDDById(this.ddGroup, id);
			} else {
				// backwards compatible for components which didn't use
				// configure the ddGroup correctly (as they actually should,
				// but as ExtJs was bugged, it was unnoticed).
				target = Ext.dd.DragDropMgr.getDDById(id);
			}

			// Literally copied from original function, we can't call the original
			// function as we have no way to pass our intended target variable.
			this.cachedTarget = target;
			if (target && this.beforeDragEnter(target, e, id) !== false) {
				if (target.isNotifyTarget) {
					var status = target.notifyEnter(this, e, this.dragData);
					this.proxy.setStatus(status);
				} else {
					this.proxy.setStatus(this.dropAllowed);
				}

				if (this.afterDragEnter) {
					this.afterDragEnter(target, e, id);
				}
			}
		},

		onDragOver : function(e, id)
		{
			// If we don't have a cached target, then we haven't got a connection
			// with a DropZone. This can happen when 2 DropZones are hovering over
			// eachother, when we enter the second DropZone, onDragEnter will have
			// unhooked the first DropZone. But since we are now hovering over it
			// again, we seem to have exited the top DropZone and we are back at
			// the first. So we force the connection again using onDragEnter().
			if (!this.cachedTarget){
				this.onDragEnter(e, id);
			}

			this.cachedTarget = this.cachedTarget || Ext.dd.DragDropMgr.getGroupDDById(this.ddGroup, id);
			return orig_onDragOver.apply(this, arguments);
		},

		onDragOut : function(e, id)
		{
			// If we haven't cached our target, then apparently we aren't hovering over
			// this DropZone. So no point in informing the onDragOut then.
			if (this.cachedTarget){
				return orig_onDragOut.apply(this, arguments);
			}
		},

		onDragDrop : function(e, id)
		{
			// If we haven't cached our target, then apparently we aren't hovering over
			// this DropZone. So no point in informing the onDragDrop then.
			if (this.cachedTarget){
				return orig_onDragDrop.apply(this, arguments);
			}
		}
	});
})();
