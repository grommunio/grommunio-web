Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.TreeGrid
 * @extends Ext.ux.tree.TreeGrid
 * @xtype zarafa.treegrid
 *
 * Extension of the {@link Ext.ux.tree.TreeGrid} containing
 * some UI fixes and enhancements to include greater similarity
 * with a normal {@link Ext.grid.GridPanel grid}.
 */
Zarafa.common.ui.TreeGrid = Ext.extend(Ext.ux.tree.TreeGrid, {
	/**
	 * @cfg {Boolean} autoFill
	 * Defaults to <tt>false</tt>.  Specify <tt>true</tt> to have the column widths re-proportioned
	 * when the grid is <b>initially rendered</b>.  The
	 * {@link Ext.grid.Column#width initially configured width}</tt> of each column will be adjusted
	 * to fit the grid width and prevent horizontal scrolling. If columns are later resized (manually
	 * or programmatically), the other columns in the grid will <b>not</b> be resized to fit the grid width.
	 * See <tt>{@link #forceFit}</tt> also.
	 */				
	autoFill : false,

	/**
	 * @cfg {Boolean} forceFit
	 * Defaults to <tt>false</tt>.  Specify <tt>true</tt> to have the column widths re-proportioned
	 * at <b>all times</b>.  The {@link Ext.grid.Column#width initially configured width}</tt> of each
	 * column will be adjusted to fit the grid width and prevent horizontal scrolling. If columns are
	 * later resized (manually or programmatically), the other columns in the grid <b>will</b> be resized
	 * to fit the grid width. See <tt>{@link #autoFill}</tt> also.
	 */
	forceFit : false,

	/**
	 * @cfg {Boolean} unselectable
	 * Defaults to <tt>true</tt>. Indicate if the {@link #el} must be made {@link Ext.Element#unselectable}
	 * during {@link #onRender rendering}. This will prevent the user from selecting any text within the tree.
	 */
	unselectable : true,

	/**
	 * Initialize the component
	 * @private
	 */
	initComponent : function()
	{
		if (this.rootVisible === true) {
			// By default the Ext.ux.tree.TreeGrid is not capable of displaying
			// the root node. So when the rootVisible option is enabled, we must
			// change the 'uiProvider' and 'ui' properties of the root node,
			// to use the TreeGridNodeUI which is capable of rendering the root
			// node.
			if (this.root) {
				this.root.attributes.uiProvider = Ext.ux.tree.TreeGridNodeUI;
				this.root.ui = new this.root.attributes.uiProvider(this.root);
			} else {
				this.root = new Ext.tree.AsyncTreeNode({text: _('Root'), uiProvider: Ext.ux.tree.TreeGridNodeUI});
			}
		}

		Zarafa.common.ui.TreeGrid.superclass.initComponent.call(this);
	},

	/**
	 * Called during rendering. When {@link #autoFill} is enabled this will call
	 * {@link #autoFitColumns} to start resizing the columns.
	 * @private
	 */
	onRender : function()
	{
		Zarafa.common.ui.TreeGrid.superclass.onRender.apply(this, arguments);
		if (this.autoFill || this.forceFit) {
			this.autoFitColumns(true);
		}
		if (this.unselectable) {
			this.getEl().unselectable();
		}
	},

	/**
	 * Obtain the offset for the Scrollbar. This returns {@link #scrollOffset}
	 * and if that property is not set the default {@link Ext.getScrollBarWidth scrollbar width}.
	 * @return {Number} Scrollbar offset
	 * @private
	 */
	getScrollOffset: function()
	{
		return Ext.num(this.scrollOffset, Ext.getScrollBarWidth());
	},

	/**
	 * Called when the {@link #columns} must be resized. This will check
	 * the total available width, and reduce it by the current configured
	 * sized of all columns. The remaining available width will be equally
	 * divided over all non-{@link Ext.grid.Column#fixed fixed} columns.
	 * @private
	 */
	autoFitColumns : function(fillOnly, skipColumn)
	{
		var availableWidth = this.innerBody.getWidth() - this.getScrollOffset();
		var autoColumns = [];

		for (var i = 0, len = this.columns.length; i < len; i++) {
			var column = this.columns[i];

			if (!column.hidden) {
				availableWidth -= column.width;
				if (!column.fixed && i !== skipColumn && !(fillOnly && column.width)) {
					autoColumns.push(column);
				}
			}
		}

		availableWidth = Math.floor(availableWidth / autoColumns.length);
		for (var i = 0, len = autoColumns.length; i < len; i++) {
			autoColumns[i].width += availableWidth;
		}
	},

	/**
	 * Check if {@link #forceFit} is enabled, if will call {@link #autoFitColumns}
	 * to resize all columns.
	 * @private
	 */
	updateColumnWidths : function()
	{
		if (this.forceFit) {
			this.autoFitColumns(false, this.colResizer.hdIndex);
		}

		Zarafa.common.ui.TreeGrid.superclass.updateColumnWidths.call(this);
	}
});

Ext.reg('zarafa.treegrid', Zarafa.common.ui.TreeGrid);
