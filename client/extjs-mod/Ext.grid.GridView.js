(function() {
	var orig_onColConfigChange = Ext.grid.GridView.prototype.onColConfigChange;
	var orig_initTemplates = Ext.grid.GridView.prototype.initTemplates;
	var orig_beforeColMenuShow = Ext.grid.GridView.prototype.beforeColMenuShow;

	Ext.override(Ext.grid.GridView, {
		/*
		 * Override the Ext.grid.GridView to fix an issue where the columns are rendered
		 * partally behind the scrollbar in Google Chrome. This is due to the fact that
		 * ExtJs assumes the borders take up no space in Chrome, while in fact they do.
		 */
		getColumnWidth: function(column)
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
		onColConfigChange: function()
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
	    initTemplates: function() {
			orig_initTemplates.apply(this);

			// Override cell template to add ARIA gridcell role
			this.templates.cell = new Ext.Template(
				'<td class="x-grid3-col x-grid3-cell x-grid3-td-{id} {css}" style="{style}" tabIndex="0" {cellAttr} role="gridcell">',
					'<div class="x-grid3-cell-inner x-grid3-col-{id} x-unselectable" unselectable="on" {attr}>{value}</div>',
				'</td>'
			);

			// Override row template to add ARIA row role
			var rowBodyText = this.enableRowBody ? [
				'<tr class="x-grid3-row-body-tr" style="{bodyStyle}">',
					'<td colspan="{cols}" class="x-grid3-body-cell" tabIndex="0" hidefocus="on">',
						'<div class="x-grid3-row-body">{body}</div>',
					'</td>',
				'</tr>'
			].join('') : '';

			var innerText = [
				'<table class="x-grid3-row-table" border="0" cellspacing="0" cellpadding="0" style="{tstyle}">',
					'<tbody>',
						'<tr>{cells}</tr>',
						rowBodyText,
					'</tbody>',
				'</table>'
			].join('');

			this.templates.row = new Ext.Template(
				'<div class="x-grid3-row {alt}" style="{tstyle}" role="row">' + innerText + '</div>'
			);
			this.templates.rowInner = new Ext.Template(innerText);

			// Override header template to add ARIA row role
			this.templates.header = new Ext.Template(
				'<table border="0" cellspacing="0" cellpadding="0" style="{tstyle}" role="rowgroup">',
					'<thead>',
						'<tr class="x-grid3-hd-row" role="row">{cells}</tr>',
					'</thead>',
				'</table>'
			);

	        var headerCellTpl = new Ext.Template(
	                '<td class="x-grid3-hd x-grid3-cell x-grid3-td-{id} {css} {cls}" style="{style}" role="columnheader" scope="col">',
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
		 * Override updateSortIcon to add aria-sort attribute for accessibility.
		 * @param {Number} col The column index
		 * @param {String} dir The sort direction ('ASC' or 'DESC')
		 * @private
		 */
		updateSortIcon: function(col, dir)
		{
			var sortClasses = this.sortClasses,
				sortClass = sortClasses[dir === 'DESC' ? 1 : 0],
				headers = this.mainHd.select('td').removeClass(sortClasses);

			headers.item(col).addClass(sortClass);

			// Update ARIA sort attributes
			headers.each(function(header) {
				header.dom.removeAttribute('aria-sort');
			});
			headers.item(col).set({ 'aria-sort': dir === 'DESC' ? 'descending' : 'ascending' });
		},

		/**
		 * Override handleHdMove to only show the resize cursor on the right
		 * edge of column headers. The default Ext JS behavior shows the resize
		 * cursor on both edges, and clicking the left edge resizes the previous
		 * column which is unintuitive.
		 * @private
		 */
		handleHdMove : function(e) {
			var header = this.findHeaderCell(this.activeHdRef);

			if (header && !this.headersDisabled) {
				var handleWidth  = this.splitHandleWidth || 8,
					activeRegion = this.activeHdRegion,
					headerStyle  = header.style,
					colModel     = this.cm,
					cursor       = '',
					pageX        = e.getPageX();

				if (this.grid.enableColumnResize !== false) {
					var activeHeaderIndex = this.activeHdIndex,
						currentResizable  = colModel.isResizable(activeHeaderIndex),
						inRightResizer    = activeRegion.right - pageX <= handleWidth;

					if (inRightResizer && currentResizable) {
						cursor = Ext.isAir ? 'move' : Ext.isWebKit ? 'w-resize' : 'col-resize';
					}
				}

				headerStyle.cursor = cursor;
			}
		},

		/**
		 * Override to list the plain column names in the column menu. The header of an icon
		 * column is markup, which drags the icon and its spacing into the menu.
		 * @private
		 */
		beforeColMenuShow: function()
		{
			orig_beforeColMenuShow.apply(this, arguments);

			this.colMenu.items.each(function(item) {
				var parsed = new DOMParser().parseFromString(item.text || '', 'text/html');
				item.setText(Ext.util.Format.htmlEncode(parsed.body.textContent.trim()));
			});
		},

	    /**
	     * @private
	     * Overriding this method so we can add a custom class to the header cells of the grid
	     * Renders the header row using the 'header' template. Does not inject the HTML into the DOM, just
	     * returns a string.
	     * @return {String} Rendered header row
	     */
	    renderHeaders: function() {
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
	                id: colModel.getColumnId(i),
	                value: colModel.getColumnHeader(i) || '',
	                style: this.getColumnStyle(i, true),
	                css: cssCls,
	                tooltip: this.getColumnTooltip(i),
	                // NB: This is the only line we add to this method, but since Ext decided to define this properties array inline we have to overwrite the whole method. (sigh)
	                cls: colModel.getColumnAt(i).headerCls || ''
	            };

	            if (colModel.config[i].align == 'right') {
	                properties.istyle = 'padding-right: 16px;';
	            } else {
	                delete properties.istyle;
	            }

	            cells[i] = headerTpl.apply(properties);
	        }

	        return templates.header.apply({
	            cells: cells.join(""),
	            tstyle: String.format("width: {0};", this.getTotalWidth())
	        });
	    }
	});

	/**
	 * Override SplitDragZone to only allow column resizing from the right
	 * edge of each header cell. The default behavior allows resizing from
	 * both edges, where the left edge resizes the previous column, which
	 * users find unintuitive.
	 */
	var orig_SplitDragZone_constructor = Ext.grid.GridView.SplitDragZone.prototype.constructor;
	Ext.override(Ext.grid.GridView.SplitDragZone, {
		constructor : function(grid, hd) {
			orig_SplitDragZone_constructor.apply(this, arguments);
			this.hw = this.view.splitHandleWidth || 8;
		},

		handleMouseDown : function(e) {
			var t = this.view.findHeaderCell(e.getTarget());
			if (t && this.allowHeaderDrag(e)) {
				var xy = this.view.fly(t).getXY(),
					x = xy[0],
					exy = e.getXY(),
					ex = exy[0],
					w = t.offsetWidth,
					adjust = false;

				// Only respond to clicks on the right edge of the header
				if ((x + w) - ex <= this.hw) {
					adjust = 0;
				}

				if (adjust !== false) {
					this.cm = this.grid.colModel;
					var ci = this.view.getCellIndex(t);
					this.cellIndex = ci + adjust;
					this.split = t.dom;
					if (this.cm.isResizable(this.cellIndex) && !this.cm.isFixed(this.cellIndex)) {
						Ext.grid.GridView.SplitDragZone.superclass.handleMouseDown.apply(this, arguments);
					}
				} else if (this.view.columnDrag) {
					this.view.columnDrag.callHandleMouseDown(e);
				}
			}
		}
	});
})();
