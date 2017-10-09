(function() {
	/*
	 * Adds the ability to conditionally allow focusing the node.
	 * This will automatically move the scroll bar to make sure that given node will
	 * be visible. Passing ensureFocus as false prevent this mechanism.
	 */
	Ext.override(Ext.tree.DefaultSelectionModel, {
		/**
		 * Select a node.
		 * @param {TreeNode} node The node to select
		 * @param {Boolean} ensureFocus True to make given folder visible in screen by focusing it.
		 * @return {TreeNode} The selected node
		 */
		select : function(node, /* private*/ selectNextNode, ensureFocus){
			// If node is hidden, select the next node in whatever direction was being moved in.
			if (!Ext.fly(node.ui.wrap).isVisible() && selectNextNode) {
				return selectNextNode.call(this, node);
			}
			var last = this.selNode;
			if(node == last){
				if (ensureFocus || !Ext.isDefined(ensureFocus)) {
					node.ui.onSelectedChange(true);
				} else {
					node.ui.addClass("x-tree-selected");
				}
			}else if(this.fireEvent('beforeselect', this, node, last) !== false){
				if(last && last.ui){
					last.ui.onSelectedChange(false);
				}
				this.selNode = node;
				node.ui.onSelectedChange(true);
				this.fireEvent('selectionchange', this, node, last);
			}
			return node;
		}
	});
})();
