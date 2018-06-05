Ext.namespace('Zarafa.common.categories.dialogs');

/**
 * @class Zarafa.common.categories.dialogs.CategoriesPanel
 * @extends Ext.Panel
 * @xtype zarafa.categoriespanel
 *
 * Panel for users to edit the categories on a given {@link Zarafa.core.data.IPMRecord record}
 */
Zarafa.common.categories.dialogs.CategoriesPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record The record(s) which are being
	 * edited through this panel
	 */
	record : undefined,
	/**
	 * @cfg {String} categorySeparator The string which must be used to separate the
	 * various categories.
	 */
	categorySeparator : ';',

	/**
	 * @cfg {Boolean} hideActionButtons If it is true then it will hide all row action button in CategoriesGrid.
	 */
	hideActionButtons : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (config.hideActionButtons) {
			this.hideActionButtons = config.hideActionButtons;
		}

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.categoriespanel',
			layout: 'fit',
			border: false,
			items: [
				this.createCategoriesGrid(config.record)
			]
		});

		Zarafa.common.categories.dialogs.CategoriesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * create grid panel for categories which contains {@link Ext.grid.CheckboxSelectionModel CheckboxSelectionModel}
	 * which can be used by the user to select/change the category from a predefined list.
	 * @param {Zarafa.core.data.IPMRecord[]} records The records that are edited with this panel
	 * @return {Object} The configuration object for the grid panel.
	 * @private
	 */
	createCategoriesGrid : function(records)
	{
		var store = new Zarafa.common.categories.data.CategoriesStore();
		store.addCategoriesFromMapiRecords(records);
		store.sort([
			{field: 'quickAccess', direction: 'DESC'},
			{field: 'sortIndex', direction: 'ASC'},
			{field: 'category', direction: 'ASC'}
		]);

		var selectionModel = this.createSelectionModel();
		var columnModel = this.createColumnModel(selectionModel);

		return {
			xtype: 'editorgrid',
			trackMouseOver: true,
			enableHdMenu: false,
			deferRowRender:false,
			autoExpandColumn: 'category',
			ref: 'categoriesGrid',
			cls: 'k-no-column-headers k-categories-grid',
			viewConfig: {
				forceFit: true,
				markDirty: false
			},
			store: store,
			sm: selectionModel,
			colModel: columnModel,
			listeners: {
				scope: this,
				afterrender: this.onAfterRender,
				cellclick: this.onCellClick,
				rowclick: this.onRowClick,
				validateedit: this.onValidateEdit,
				afteredit : this.onAfterEdit
			},
			onCellDblClick : Ext.emptyFn
		};
	},

	/**
	 * Returns the selection model that will be used for the categories grid.
	 *
	 * @return {Ext.grid.CheckboxSelectionModel} The selection model
	 */
	createSelectionModel : function()
	{
		return new Ext.grid.CheckboxSelectionModel({
			checkOnly : true,
			moveEditorOnEnter: false
		});
	},

	/**
	 * Returns the column model that will be used for the categories grid.
	 *
	 * @param {Ext.grid.CheckboxSelectionModel} selectionModel The selection model of
	 * the categories grid.
	 * @return {Ext.grid.ColumnModel} The column model
	 */
	createColumnModel : function(selectionModel)
	{
		return new Ext.grid.ColumnModel({
			columns: [
				selectionModel,
				{
					id			: 'color',
					dataIndex	: 'color',
					sortable	: false,
					width		: 25,
					fixed		: true,
					renderer 	: this.categoryColorRenderer
				},
				{
					dataIndex	: 'category',
					editor		: new Ext.form.TextField({
						allowBlank: false,
						enableKeyEvents: true,
						listeners : {
							scope: this,
							keydown: function(field, e){
								var key = e.browserEvent.key;
								if ( key === ';' || key === ',' ){ // Don't allow ; or , in a category name
									e.preventDefault();
								}
							}
						}
					}),
					sortable	: false,
					hideActionButtons : this.hideActionButtons,
					renderer 	: this.categoryNameRenderer
				}
			]
		});
	},

	/**
	 * Function that will be used to render the category color cell in the grid.
	 *
	 * @param {String} color The color in hex rgb format
	 * @param {Object} metaData An object with some data of the cell that is being
	 * rendered.
	 * @param {Ext.data.Record} record The record from the
	 * {@link Zarafa.common.categories.data.CategoriesStore CategoriesStore} for
	 * which this cell is rendered.
	 * @return {String} The html that will be used to render the cell.
	 */
	categoryColorRenderer : function(color, metaData, record)
	{
		var html = Zarafa.common.categories.Util.getCategoryIconSVG(color);

		var cls = Ext.isNumber(record.get('standardIndex')) ? ' k-category-fixed' : '';
		html += '<div class="k-colorpicker-ct' + cls + '" style="background-color:'+color+';"></div>';

		return html;
	},

	/**
	 * Function that will be used to render the category name cell in the grid.
	 *
	 * @param {String} value The name of the category
	 * @param {Object} metaData An object with some data of the cell that is being
	 * rendered.
	 * @param {Ext.data.Record} record The record from the
	 * {@link Zarafa.common.categories.data.CategoriesStore CategoriesStore} for
	 * which this cell is rendered.
	 * @return {String} The html that will be used to render the cell.
	 */
	categoryNameRenderer : function(value, metaData, record)
	{
		var cls = record.get('quickAccess') ? ' zarafa-pinned' : '';
		cls += Ext.isNumber(record.get('standardIndex')) ? ' k-category-fixed' : '';

		if(this.hideActionButtons) {
			return Ext.util.Format.htmlEncode(value);
		}

		return Ext.util.Format.htmlEncode(value) +
			'<div class="zarafa-grid-button-container' + cls + '">' +
				'<div class="zarafa-grid-button k-grid-button-edit"></div>' +
				'<div class="zarafa-grid-button k-grid-button-delete"></div>' +
				'<div class="zarafa-grid-button k-grid-button-pin"></div>' +
			'</div>';
	},

	/**
	 * Handler for afterrender event. Will select the categories that are set on the
	 * records to which this panel applies, will create the color pickers in the grid
	 * rows, and will add event listeners.
	 * listeners
	 * @param {Ext.grid.EditorGridPanel} grid The grid with all the categories
	 * @private
	 */
	onAfterRender : function(grid)
	{
		grid.getSelectionModel().suspendEvents(false);
		var records = this.getAvailableCategories();
		if(!Ext.isEmpty(records)) {
			grid.getSelectionModel().selectRecords(records);
		}

		grid.getSelectionModel().resumeEvents();

		var view = grid.getView();
		this.addColorPickers(view);

		this.mon(grid.store, 'add', function(){
			grid.store.sort([
				{field: 'quickAccess', direction: 'DESC'},
				{field: 'sortIndex', direction: 'ASC'},
				{field: 'category', direction: 'ASC'}
			]);
		});

		this.mon(view, 'refresh', this.addColorPickers, this);
		this.mon(view, 'rowupdated', this.onRowUpdated, this);
	},

	/**
	 * Adds a {@link Zarafa.common.ui.ColorPicker} to every color cell.
	 * @param {Ext.grid.GridView} view The view of the categories grid
	 */
	addColorPickers : function(view)
	{
		this.categoriesGrid.store.each(function(record, index){
			var el = Ext.get(view.getCell(index, 1).querySelector('.k-colorpicker-ct'));
			var color = (record.get('color') || '') + '';
			var colorPicker = new Zarafa.common.ui.ColorPicker({
				renderTo: el.dom,
				value: color.replace('#', '')
			});
			colorPicker.on('show', this.onColorPickerShowMenu.createDelegate(this, [colorPicker], true));
			colorPicker.on('hide', this.onColorPickerHideMenu.createDelegate(this, [colorPicker], true));
			colorPicker.on('select', this.onSelectColor.createDelegate(this, [record], true));

			record.colorPicker = colorPicker;
		}, this);
	},

	/**
	 * Event handler for the rowupdated event of the grid view
	 *
	 * @param {Ext.grid.GridView} view The view component of the grid
	 * @param {Number} rowIndex The number of the row that was updated
	 * @param {Ext.data.Record} record The record of the
	 * {@link Zarafa.common.categories.data.CategoriesStore CategoriesStore}
	 * for which the row was updated.
	 */
	onRowUpdated : function(view, rowIndex, record)
	{
		// Rerender the colorPicker
		if ( record.colorPicker ){
			var el = Ext.get(view.getCell(rowIndex, 1).querySelector('.k-colorpicker-ct'));
			record.colorPicker.renderTo = el.dom;
			record.colorPicker.rendered = false;
			record.colorPicker.el = undefined;
			record.colorPicker.render(el);
		}
	},

	/**
	 * Event handler for the show event of the menu of the color pickers. Will
	 * add the class <i>k-menu-visible</i> to the cell element.
	 *
	 * @param {Ext.menu.ColorMenu} menu The menu that is shown.
	 * @param {Zarafa.common.ui.ColorPicker} colorPicker the color picker that
	 * fired the event.
	 */
	onColorPickerShowMenu : function(menu, colorPicker)
	{
		var cellEl = colorPicker.el.up('div').up('div');
		cellEl.addClass('k-menu-visible');
	},

	/**
	 * Event handler for the hide event of the menu of the color pickers. Will
	 * remove the class <i>k-menu-visible</i> to the cell element.
	 *
	 * @param {Ext.menu.ColorMenu} The menu that is hidden.
	 * @param {Zarafa.common.ui.ColorPicker} colorPicker the color picker that
	 * fired the event.
	 */
	onColorPickerHideMenu : function(menu, colorPicker)
	{
		var cellEl = colorPicker.el.up('div').up('div');
		cellEl.removeClass('k-menu-visible');
	},

	/**
	 * Event handler for the select event of one of the color pickers. Will
	 * set the selected color on the category record.
	 *
	 * @param {Zarafa.common.ui.ColorPicker} colorPicker the color picker that
	 * fired the event.
	 * @param {String} color The color that was selected in hex RGB format.
	 * @param {Ext.data.Record} record The category record that this menu will
	 * act on.
	 */
	onSelectColor : function(colorPicker, color, record)
	{
		record.set('color', '#' + color);
	},

	/**
	 * Event handler for the cellclick event of the category grid. Will
	 * take care of the selection behavior of the grid.
	 *
	 * @param {Ext.grid.GridPanel} grid The category grid
	 * @param {Number} rowIndex The index of the row that was clicked.
	 * @param {Number} columnIndex The index of the column that was clicked.
	 * @param {Ext.EventObject} event The event object of the cellclick event.
	 */
	onCellClick : function(grid, rowIndex, columnIndex, event)
	{
		var targetEl = Ext.get(event.target);

		// Check the class to make sure we don't select when the user clicks
		// on one of the buttons (edit, delete, pin)
		if ( columnIndex === 2 && targetEl.hasClass('x-grid3-col-category') ){
			var sm = grid.getSelectionModel();
			if ( sm.isSelected(rowIndex) ){
				sm.deselectRow(rowIndex);
			} else {
				sm.selectRow(rowIndex, true);
			}
		}
	},

	/**
	 * Event handler for the rowclick event of the category grid. Will check
	 * if one of the pin/edit/delete icons was clicked and handle accordingly.
	 * also it will open {@link Zarafa.common.categories.dialogs.RenameCategoryPanel RenameCategoryPanel}
	 * when standard categories like 'Red', 'Green' etc. checkbox is checked for first time.
	 *
	 * @param {Ext.grid.GridPanel} grid The category grid
	 * @param {Number} rowIndex The index of the row that was clicked.
	 * @param {Ext.EventObject} event The event object of the rowclick event.
	 */
	onRowClick : function(grid, rowIndex, event)
	{
		// Make sure the grid will not scroll to the row that was focussed
		// before the click by putting the focus on the clicked row.
		grid.getView().focusRow(rowIndex);

		var targetEl = Ext.get(event.target);
		if ( targetEl.hasClass('k-grid-button-pin') && !targetEl.up('div').hasClass('zarafa-pin-fixed') ){
			this.toggleCategoryPin(rowIndex);
		} else if ( targetEl.hasClass('k-grid-button-edit') ){
			this.editCategoryName(rowIndex);
		} else if ( targetEl.hasClass('k-grid-button-delete') ){
			this.deleteCategory(rowIndex);
		} else if(targetEl.hasClass('x-grid3-row-checker')) {
			// If check box is unchecked then just return.
			if(!grid.getColumnModel().getColumnById('checker').isSelected(rowIndex)) {
				return;
			}
			var category = grid.getStore().getAt(rowIndex);
			var standardIndex = category.get('standardIndex');
			if(Ext.isEmpty(standardIndex)) {
				return;
			}

			if(category.get('used') === false) {
				Zarafa.common.Actions.openRenameCategoryContent({
					store: grid.getStore(),
					isCategoryGrid : true,
					categoryName : category.get('category'),
					color : category.get('color')
				});
			}
		}
	},

	/**
	 * Will handle clicks on the pin icon of a row.
	 *
	 * @param {Number} rowIndex The index of the row in which the pin icon
	 * was clicked.
	 */
	toggleCategoryPin : function(rowIndex)
	{
		var categoryRecord = this.categoriesGrid.getStore().getAt(rowIndex);
		categoryRecord.set('quickAccess', !categoryRecord.get('quickAccess'));
	},

	/**
	 * Will open the grid editor of the category name of a row.
	 *
	 * @param {Number} rowIndex The index of the row in which the pin icon
	 * was clicked.
	 */
	editCategoryName : function(rowIndex)
	{
		this.categoriesGrid.startEditing(rowIndex, 2);
	},

	/**
	 * Will delete the category from the store that is bound to the grid.
	 * <i>ote: It will not be deleted from the settings until the user clicks
	 * on the 'Apply' button.</i>
	 *
	 * @param {Number} rowIndex The number of the row in the grid that shows
	 * the category that must be deleted.
	 */
	deleteCategory : function(rowIndex)
	{
		var store = this.categoriesGrid.getStore();
		var categoryRecord = store.getAt(rowIndex);
		var categoryName = Ext.util.Format.htmlEncode(categoryRecord.get('category'));
		Zarafa.common.dialogs.MessageBox.addCustomButtons({
			width: 400,
			title: _('Delete Category'),
			msg : String.format(_('Are you sure you want to delete the category "{0}"? Items already assigned this category won\'t be affected.'), categoryName),
			icon: Ext.MessageBox.QUESTION,
			fn : function(buttonName){
				if ( buttonName === 'delete' ){
					var categoryStore = this.categoriesGrid.getStore();
					categoryStore.removeAt(rowIndex);
				}
			},
			customButton: [{
				name : 'delete',
				text: _('Delete')
			}, {
				name : 'cancel',
				text: _('Cancel')
			}],
			scope: this
		});
	},

	/**
	 * Handler for the validateedit event of the grid. Will check if
	 * the entered category name does not already exist.
	 *
	 * @param {Object} event The {@link Ext.grid.EditorGridPanelView.validateedit event object}
	 */
	onValidateEdit : function(event)
	{
		var categoryStore = event.grid.getStore();
		var categoryExists = false;
		categoryStore.each(function(categoryRecord){
			if ( categoryRecord === event.record ){
				return;
			}

			if ( categoryRecord.get('category').toLowerCase() === event.value.toLowerCase() ){
				categoryExists = true;
				return false;
			}
		}, this);

		if ( categoryExists ){
			Zarafa.common.dialogs.MessageBox.alert(
				_('Rename Category'),
				_('A category named "' + Ext.util.Format.htmlEncode(event.value) + '" already exists. Please enter a different category name.'),
				function(){
					// Open the editor again so the user can change the name again
					this.categoriesGrid.startEditing(event.row, 2);
				},
				this
			);

			event.cancel = true;
		}
	},

	/**
	 * Handler for the afteredit event of the grid. Will make sure the new category name will
	 * be saved.
	 *
	 * @param {Object} event The {@link Ext.grid.EditorGridPanelView.afteredit event object}
	 */
	onAfterEdit : function(event)
	{
		if ( event.value !== event.originalValue ){
			event.record.set('stored', true);
		}
	},

	/**
	 * return all categories records from the managed categories list
	 * @return {Array} of {@link Ext.data.Record Records}
	 * @private
	 */
	getAvailableCategories : function()
	{
		var activeAvailableCategories = [];
		var categoriesGrid = this.categoriesGrid;
		var categories = Zarafa.common.categories.Util.getAllCategories(this.record);

		for (var i = 0; i < categories.length; i++) {
			for (var j = 0; j < categoriesGrid.getStore().getCount(); j++) {
				if (categories[i] == categoriesGrid.getStore().getAt(j).get('category')) {
					activeAvailableCategories.push(categoriesGrid.getStore().getAt(j));
					break;
				}
			}
		}
		return activeAvailableCategories;
	},

	/**
	 * Returns an array with the names of all selected categories.
	 * @return {Array} An array with the names of the selected categories
	 */
	getSelectedCategories : function()
	{
		var records = this.categoriesGrid.getSelectionModel().getSelections();
		return records.map(function(record) {
			return record.get('category');
		}, this);
	}
});

Ext.reg('zarafa.categoriespanel', Zarafa.common.categories.dialogs.CategoriesPanel);
