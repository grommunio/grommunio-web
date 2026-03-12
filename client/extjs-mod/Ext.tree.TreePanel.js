(function() {
	Ext.override(Ext.tree.TreePanel, {
		/**
		 * Override onRender to add ARIA tree role for accessibility.
		 * Sets role="tree" on the tree container and aria-label from the title.
		 */
		onRender: Ext.tree.TreePanel.prototype.onRender.createSequence(function() {
			if (this.el) {
				this.el.set({ 'role': 'tree' });
				if (this.title) {
					this.el.set({ 'aria-label': this.title });
				}
			}
		})
	});

	var orig_updateExpandIcon = Ext.tree.TreeNodeUI.prototype.updateExpandIcon;

	Ext.override(Ext.tree.TreeNodeUI, {
		/**
		 * Override updateExpandIcon to maintain aria-expanded state on tree items.
		 */
		updateExpandIcon: function()
		{
			orig_updateExpandIcon.apply(this, arguments);
			if (this.elNode) {
				var n = this.node;
				if (n.hasChildNodes()) {
					this.elNode.setAttribute('aria-expanded', n.isExpanded() ? 'true' : 'false');
				} else {
					this.elNode.removeAttribute('aria-expanded');
				}
			}
		},

		/**
		 * Override onRender to add role="treeitem" and aria-level to rendered tree nodes.
		 */
		onRender: Ext.tree.TreeNodeUI.prototype.onRender.createSequence(function() {
			if (this.elNode) {
				this.elNode.setAttribute('role', 'treeitem');
				// Set aria-level based on node depth (root is depth 0, first visible is 1)
				var depth = this.node.getDepth();
				if (depth > 0) {
					this.elNode.setAttribute('aria-level', depth);
				}
			}
			// Mark child list container as group
			if (this.ctNode) {
				this.ctNode.setAttribute('role', 'group');
			}
		})
	});
})();
