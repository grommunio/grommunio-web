Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.MapiMessageGrid
 * @extends Zarafa.common.ui.grid.GridPanel
 * @xtype zarafa.mapimessagegrid
 *
 * Grid for MAPI messages, like Notes, Mails, Appointments, Tasks, Contacts.
 * To handle specific action that are performed on MAPI messages grid, like keyboard controls.
 */
Zarafa.common.ui.grid.MapiMessageGrid = Ext.extend(Zarafa.common.ui.grid.GridPanel, {
	/*
	 * @TODO :
	 * This grid is created only to handle keyboard events easily for
	 * Notes, Mails, Appointments, Tasks, Contacts.
	 * This allows 'grid.mapimessage' mapid to register common key events on
	 * above grids and handle them without code duplication.
	 * Grids like addressbookgrid, attachitemgrid, rulesgrid, remindergrid doesn't
	 * have common key mapping but extends Zarafa.common.ui.grid.GridPanel.
	 */

	/**
	 * The tooltip that will be used to show the full name of truncated categories
	 * @property
	 * @type {Zarafa.common.categories.ui.Tooltip}
	 */
	categoryTooltip : null,

	/**
	 * The supportLiveScroll is true if grid supports live scroll facility and
	 * default it is false.
	 *
	 * @property
	 * @type Boolean
	 */
	supportLiveScroll : false,

	/**
	 * Timer that is used to slide in/out loaded mail info slider after specified time.
	 * @property
	 * @type Number
	 */
	timer : undefined,

	/**
	 * @cfg sliderDuration specified time duration after that slide gets hide/remove the slide
	 * from DOM.
	 * @type Number
	 */
	sliderDuration : 5000,

	/**
	 * @cfg sliderDirection specified the direction where slider want to show in grid.
	 * default is 'b'.
	 * @type Number
	 */
	sliderDirection : 'b',

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			view: new Zarafa.common.ui.grid.GridView(config.viewConfig)
		});

		Zarafa.common.ui.grid.MapiMessageGrid.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize event handlers
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.common.ui.grid.MapiMessageGrid.superclass.initEvents.call(this);

		this.mon(this.getView().scroller, 'scroll', this.onScroll, this);
		this.on({
			'afterrender': this.onRenderGrid,
			'cellcontextmenu': this.onCellContextMenu,
			scope : this
		});

		// Only add the event listeners that resize the category labels when
		// we actually have a category column
		var columnModel = this.getColumnModel();
		if ( columnModel.getIndexById('categories') >= 0 ){
			this.on({
				'viewready': this.resizeCategoryLabels,
				'resize': this.resizeCategoryLabels,
				'columnresize': this.resizeCategoryLabels,
				scope : this
			});

			this.mon(this.store, 'load', this.resizeCategoryLabels, this);
		}
	},

	/**
	 * Event handler for the afterrender event of this panel. Creates a tooltip
	 * that will be used to show the full name of truncated categories.
	 * @param (Zarafa.mail.ui.MailGrid) grid this
	 */
	onRenderGrid : function(grid)
	{
		// Create a tooltip that will be used for truncated category labels
	    this.categoryTooltip = new Zarafa.common.categories.ui.Tooltip({
	        target: grid.getView().mainBody
	    });
	},

	/**
	 * Event handler which is triggered when the user opens the context menu.
	 *
	 * There are some selection rules regarding the context menu. If no rows where
	 * selected, the row on which the context menu was requested will be marked
	 * as selected. If there have been rows selected, but the context menu was
	 * requested on a different row, then the old selection is lost, and the new
	 * row will be selected. If the row on which the context menu was selected is
	 * part of the previously selected rows, then the context menu will be applied
	 * to all selected rows.
	 *
	 * @param {Zarafa.mail.ui.MailGrid} grid The grid which was right clicked
	 * @param {Number} rowIndex The index number of the row which was right clicked
	 * @param {Number} cellIndex The index number of the column which was right clicked
	 * @param {Ext.EventObject} event The event structure
	 * @private
	 */
	onCellContextMenu : function(grid, rowIndex, cellIndex, event)
	{
		var selectionModel = this.getSelectionModel();
		var columnModel = this.getColumnModel();

		if ( !selectionModel.isSelected(rowIndex) ) {
			selectionModel.selectRow(rowIndex);
		}

		// Take into account that the function onRowBodyContextMenu passes -1 as the column index.
		var dataIndex = (cellIndex >= 0) ? columnModel.getDataIndex(cellIndex) : undefined;
		var records = selectionModel.getSelections();

		switch (dataIndex) {
			case 'importance':
				Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.importance'], records, { position : event.getXY() });
				break;
			default:
				// If the click was on a category, we must open the category context menu
				var targetElement = Ext.get(event.target);
				if ( targetElement.hasClass('k-category-block') ){
					Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.category'], records, {
						category: targetElement.dom.textContent,
						position : event.getXY()
					});
					return;
				}

				Zarafa.core.data.UIFactory.openDefaultContextMenu(records, {
					position : event.getXY(),
					context : this.context,
					actsOnTodoListFolder : this.model.getDefaultFolder().isTodoListFolder()
				});
				break;
		}
	},

	/**
	 * Event handler for the viewready, resize, and columnresize events. Will
	 * resize the category labels in the category column (for the non-compact view)
	 */
	resizeCategoryLabels : function()
	{
		var columnModel = this.getColumnModel();
		var categoriesColIndex = columnModel.findColumnIndex('categories');

		// Only do the resizing when we are in the full view and the category
		// column is not hidden
		if ( categoriesColIndex === -1 || columnModel.isHidden(categoriesColIndex) ){
			return;
		}

		// Subtract the padding of the column
		var colWidth = columnModel.getColumnWidth(categoriesColIndex) - 16;

		var rows = this.getView().getRows();
		Ext.each(rows, function(row){
			var labels = row.querySelectorAll('.k-category-block');
			if ( Ext.isEmpty(labels[0]) ){
				return;
			}

			this.resizeCategoryLabelsInRow(row, labels, colWidth);
		}, this);
	},

	/**
	 * Calculates the width of the category labels in a row and will resize them if they
	 * are too large.
	 * @param {HtmlElement} row The container element of the row in the grid
	 * @param {Array} labels Array of HtmlElements that represent the category labels of
	 * the given row
	 * @param {Number} colWidth The width of the categories column in pixels
	 * @private
	 */
	resizeCategoryLabelsInRow : function(row, labels, colWidth)
	{
		var labelCount = labels.length;

		// Instead of hardcoding the margin and padding, we will read it once from the first label we find
		this.labelMarginRight = this.labelMarginRight || parseFloat(window.getComputedStyle(labels[0]).marginRight);
		this.labelPaddingLeftRight = this.labelPaddingLeftRight || parseFloat(window.getComputedStyle(labels[0]).paddingLeft) + parseFloat(window.getComputedStyle(labels[0]).paddingRight);

		// Calculate what the label width would be if we would divide the column width by the number of labels
		// (taking into acount the right-margin of a label)
		var labelWidth = (colWidth + this.labelMarginRight)/labelCount - this.labelMarginRight - this.labelPaddingLeftRight;

		// Some labels are smaller than the calculated label width, so we will divide the space that
		// is not used over the remaining labels
		var unusedSpace = 0;
		var smallLabels = [];
		Ext.each(labels, function(label, index){
			// Temporarily disable the max-width, so we can get the untruncated width of the label
			var maxWidth = label.style.maxWidth;
			label.style.maxWidth = 'none';
			var width = parseFloat(window.getComputedStyle(label).width);
			if ( width < labelWidth ){
				smallLabels.push(index);
				unusedSpace += labelWidth - width;
			}
			label.style.maxWidth = maxWidth;
		}, this);

		// Now we can recalculate the label width
		labelWidth = labelWidth + unusedSpace/(labelCount-smallLabels.length);

		// Finally apply the calculated label width to all labels that need it
		Ext.each(labels, function(label, index){
			if ( smallLabels.indexOf(index) > -1 ){
				label.style.maxWidth = '';
			} else {
				label.style.maxWidth = labelWidth + 'px';
			}
		}, this);

		// Note: There might still be labels smaller than the maxWidth, so there could be space left.
		// Fixing this iteratively would be too much of a performance decrease, so we will settle for
		// these 'pseudo' optimized label widths.
	},

	/**
	 * Event handler which triggers when scrollbar is scroll.
	 * Slider element hide after 5 second of stop scrolling.
	 */
	onScroll : function()
	{
		if (!container.getSettingsModel().get('zarafa/v1/contexts/mail/enable_live_scroll')
			|| !this.supportLiveScroll) {
			return;
		}

		if (this.timer) {
			clearTimeout(this.timer);
		}

		this.timer = setTimeout(function(element) {
			element.ghost('b', {remove : true});
		}, this.sliderDuration, this.getSlider());
	},

	/**
	 * Function which prepare the slide element.
	 *
	 * @return {Ext.Element} slider element which show current loaded items in grid.
	 */
	getSlider : function ()
	{
		var store = this.getStore();
		var sliderText = String.format(_('Loaded {0} of {1}'), store.getRange().length, store.getTotalCount());
		var html = String.format('<div>{0}</div>', sliderText);

		var element = this.getSliderEl();
		if (!element) {
			var sliderCls = 'k-slider';
			var sliderId = this.id + '-' + sliderCls;
			var parentContainer = this.getEl();
			element = Ext.DomHelper.insertFirst(parentContainer, { id : sliderId, cls : sliderCls, html : html}, true);
			element.alignTo(parentContainer, this.sliderDirection +'-' + this.sliderDirection, [-8, 0]);
			element = element.slideIn(this.sliderDirection);
		} else {
			element.dom.innerHTML = html;
		}
		return element;
	},

	/**
	 * Function which used to get the slider element,
	 * if it is exist in DOM.
	 *
	 * @return {Ext.Element|null} slider element if exist in DOM.
	 */
	getSliderEl : function()
	{
		var sliderCls = 'k-slider';
		var sliderId = this.id + '-' + sliderCls;
		var element = Ext.DomQuery.select('#' + sliderId).shift();
		return Ext.get(element);
	},

	/**
	 * Called when grid is being resized. This will align
	 * the slider element to bottom center.
	 *
	 * @private
	 */
	onResize : function()
	{
		Zarafa.common.ui.grid.MapiMessageGrid.superclass.onResize.apply(this, arguments);

		var sliderEl = this.getSliderEl();
		if (sliderEl) {
			sliderEl.alignTo(this.getEl(), this.sliderDirection + '-' + this.sliderDirection,[-8, 0]);
		}
	}
});

Ext.reg('zarafa.mapimessagegrid', Zarafa.common.ui.grid.MapiMessageGrid);
