(function() {
	/*
	 * Fix the Ext.tree.TreeDropZone, which asks Ext.dd.Registry for the element the
	 * event happened on. A tree node registers its row and a few of its children as
	 * handles, so everything else inside the row - the anchor filling it, the owner
	 * suffix of a shared folder, the expander - answers for nothing and the drop is
	 * refused there. Fall back to the row the event came from.
	 */
	var orig_getTargetFromEvent = Ext.tree.TreeDropZone.prototype.getTargetFromEvent;

	Ext.override(Ext.tree.TreeDropZone, {
		getTargetFromEvent: function(e)
		{
			var target = orig_getTargetFromEvent.apply(this, arguments);
			if (target) {
				return target;
			}

			var node = Ext.lib.Event.getTarget(e);
			var row = node && node.closest ? node.closest('.x-tree-node-el') : null;

			return row ? Ext.dd.Registry.getTarget(row) : null;
		}
	});
})();
