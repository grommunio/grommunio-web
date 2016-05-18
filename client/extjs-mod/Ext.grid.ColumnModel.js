(function() {
	var orig_setColumnWidth = Ext.grid.ColumnModel.prototype.setColumnWidth;

	Ext.override(Ext.grid.ColumnModel, {
		/**
		 * {@link Ext.grid.GridView#fitColumns fitColumns} has buggy behavior,
		 * which generates the fraction using division operation. When all columns 
		 * are disable (except fixed width columns), then fraction is "Infinity" 
		 * because the division operation is performed with "0". So to overcome this problem
		 * we check that width should not be infinite.
		 * 
		 * @param {Number} col The column index
		 * @param {Number} width The new width
		 * @param {Boolean} suppressEvent True to suppress firing the <code>{@link #widthchange}</code>
		 * event. Defaults to false.
		 */
		setColumnWidth : function(col, width, suppressEvent)
		{
			if(isFinite(width)) {
				orig_setColumnWidth.apply(this, arguments);
			}
		}
	});
})();