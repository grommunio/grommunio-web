(function() {
	var orig_onColConfigChange = Ext.grid.GridView.prototype.onColConfigChange;
	var orig_initTemplates = Ext.grid.GridView.prototype.initTemplates;

	Ext.override(Ext.grid.GridView, {
		/*
		 * Override the Ext.grid.GridView to fix an issue where the columns are rendered
		 * partally behind the scrollbar in Google Chrome. This is due to the fact that
		 * ExtJs assumes the borders take up no space in Chrome, while in fact they do.
		 */
		getColumnWidth : function(column)
		{
			var columnWidth = this.cm.getColumnWidth(column);
			var borderWidth = this.borderWidth;

			if (Ext.isNumber(columnWidth)) {
				// Original if-statement: Ext.isBorderBox || (Ext.isWebKit && !Ext.isSafari2)
				if (Ext.isBorderBox) {
					return columnWidth + 'px';
				} else {
					return Math.max(columnWidth - borderWidth, 0) + 'px';
				}
			} else {
				return columnWidth;
			}
		},

		/**
		 * Event handler for the {@link #cm}#{@link Ext.grid.ColumnModel#configchange configchange} event.
		 * This will call {@link Ext.grid.GridPanel#initState initState} on the {@link #grid}.
	 	 * @private
	 	 */
		onColConfigChange : function()
		{
			// Call initState on the gridpanel at this exact time, the superclass will
			// perform a layout on the applied configuration and needs the updated information.
			var grid = this.grid;

			if(grid.stateful !== false) {
				grid.initState();
			}

			orig_onColConfigChange.apply(this, arguments);
		},

	    /**
	     * @private
	     * Overriding this method so we can add a custom class to the header cells of the grid
	     * Provides default templates if they are not given for this particular instance. Most of the templates are defined on
	     * the prototype, the ones defined inside this function are done so because they are based on Grid or GridView configuration
	     */
	    initTemplates : function() {
			orig_initTemplates.apply(this);
	    	
	        var headerCellTpl = new Ext.Template(
	                '<td class="x-grid3-hd x-grid3-cell x-grid3-td-{id} {css} {cls}" style="{style}">',
	                    '<div {tooltip} {attr} class="x-grid3-hd-inner x-grid3-hd-{id}" unselectable="on" style="{istyle}">', 
	                        this.grid.enableHdMenu ? '<a class="x-grid3-hd-btn" href="#"></a>' : '',
	                        '<div class="zarafa-x-grid3-hd-title">{value}</div>',
	                        '<img alt="" class="x-grid3-sort-icon" src="', Ext.BLANK_IMAGE_URL, '" />',
	                    '</div>',
	                '</td>'
	           );
	           
	        headerCellTpl.disableFormats = true;
	        this.templates.hcell = headerCellTpl.compile();
	    },
	
	    /**
	     * @private
	     * Overriding this method so we can add a custom class to the header cells of the grid
	     * Renders the header row using the 'header' template. Does not inject the HTML into the DOM, just
	     * returns a string.
	     * @return {String} Rendered header row
	     */
	    renderHeaders : function() {
	        var colModel   = this.cm,
	            templates  = this.templates,
	            headerTpl  = templates.hcell,
	            properties = {},
	            colCount   = colModel.getColumnCount(),
	            last       = colCount - 1,
	            cells      = [],
	            i, cssCls;
	        
	        for (i = 0; i < colCount; i++) {
	            if (i == 0) {
	                cssCls = 'x-grid3-cell-first ';
	            } else {
	                cssCls = i == last ? 'x-grid3-cell-last ' : '';
	            }
	            
	            properties = {
	                id     : colModel.getColumnId(i),
	                value  : colModel.getColumnHeader(i) || '',
	                style  : this.getColumnStyle(i, true),
	                css    : cssCls,
	                tooltip: this.getColumnTooltip(i),
	                // NB: This is the only line we add to this method, but since Ext decided to define this properties array inline we have to overwrite the whole method. (sigh)
	                cls    : colModel.getColumnAt(i).headerCls || ''
	            };
	            
	            if (colModel.config[i].align == 'right') {
	                properties.istyle = 'padding-right: 16px;';
	            } else {
	                delete properties.istyle;
	            }
	            
	            cells[i] = headerTpl.apply(properties);
	        }
	        
	        return templates.header.apply({
	            cells : cells.join(""),
	            tstyle: String.format("width: {0};", this.getTotalWidth())
	        });
	    }
	});
})();
