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
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.categoriespanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			defaults: {
				border: false,
				bodyStyle: 'padding-bottom: 5px; background-color: inherit;'
			},
			items: [
				this.createFormCategoriesField(),
				this.createFormSelectionArea()
			]
		});

		Zarafa.common.categories.dialogs.CategoriesPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Create the main categories input panel. This contains the main
	 * {@link Ext.form.TextArea textarea} in which the user can type the categories.
	 * @return {Object} The configuration object for the categories panel.
	 * @private
	 */
	createFormCategoriesField : function()
	{
		return {
			xtype: 'panel',
			layout: 'fit',
			height: 100,
			title: _('Item belongs to these categories'),
			items: [{
				xtype: 'textarea',
				hideLabel: true,
				ref: '../categoriesTextArea'
			}]
		};
	},

	/**
	 * Create the main selection panel which contains the {@link Ext.grid.GridPanel GridPanel}
	 * which can be used by the user to select the category from a predefined list.
	 * @return {Object} The configuration object for the selection panel.
	 *
 	 * @private
	 */
	createFormSelectionArea : function()
	{

		return [{
			xtype: 'panel',
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			flex: 1,
			title: _('Available categories'),
			defaults: {
				border: false,
				bodyStyle: 'background-color: inherit;'
			},
			items: [{
				xtype: 'panel',
				layout: 'fit',
				flex: 1,
				items: this.createCategoriesGrid()
			}]
		}];
	},

	/**
	 * create gird panel for categories which contains {@link Ext.grid.CheckboxSelectionModel CheckboxSelectionModel}
	 * which can be used by the user to select/change the category from a predefined list.
	 * @return {Object} The configuration object for the grid panel.
	 * @private
	 */
	createCategoriesGrid : function()
	{
		var model = new Ext.grid.CheckboxSelectionModel({
			singleSelect: false,
			checkOnly : true,
			listeners: {
				selectionchange : this.onSelectionChange,
				scope: this
			}
		});

		return {
			xtype: 'grid',
			border: true,
			enableHdMenu: false,
			deferRowRender:false,
			autoExpandColumn: 'category',
			ref: '../../categoriesGrid',
			viewConfig: {
				forceFit: true,
				autoExpandColumn: true,
				scrollOffset: 0
			},
			store: new Zarafa.common.categories.data.CategoriesStore(),
			colModel: new Ext.grid.ColumnModel({
				columns: [
					model,
				{
					id		: 'category',
					header	: _('Category'),
					dataIndex: 'category',
					sortable: false,
					renderer : Ext.util.Format.htmlEncode
				}]
			}),
			sm: model,
			listeners: {
				scope: this,
				afterrender: this.onAfterRender
			}
		};
	},

	/**
	 * Obtain a reference to the {@link Ext.form.TextArea textarea} in which
	 * the user can type his categories manually.
	 *
	 * @return {Ext.form.TextArea} The textarea
	 * @private
	 */
	getCategoriesTextArea : function()
	{
		return this.categoriesTextArea;
	},

	/**
	 * Obtain a reference to the {@link Ext.grid.GridPanel} used to select
	 * from a list of existing Categories.
	 *
	 * @return {Ext.grid.GridPanel} The grid panel
	 * @private
	 */
	getCategoriesGrid : function()
	{
		return this.categoriesGrid;
	},

	/**
	 * handler for event afterrender
	 * @pirvate 
	 */
	onAfterRender : function()
	{
		this.getCategoriesGrid().getSelectionModel().suspendEvents(false);
		var records = this.getAvailableCategories();
		if(!Ext.isEmpty(records)) {
			this.getCategoriesGrid().getSelectionModel().selectRecords(records);
		}
		
		this.updateCategories(this.getActiveCategories());
		this.getCategoriesGrid().getSelectionModel().resumeEvents();
	},
	
	/**
	 * return all categories which are active/set for record
	 * @return {Array} The array of categories
	 * @private
	 */
	getActiveCategories : function()
	{
		var activeCategories  = [];
		var category = [];
		var categoryString = '';
		
		if(Ext.isDefined(this.record)){
			Ext.each(this.record, function(record) {
				categoryString = record.get('categories');
								
				if(!Ext.isEmpty(categoryString)){
					category = categoryString.split(this.categorySeparator);
					for(var i=0;i<category.length;i++){
						activeCategories.push(category[i]);
					}
				}
				
			}, this);
		}
		
		activeCategories = Zarafa.core.Util.trimStringArray(activeCategories);
		
		return Zarafa.core.Util.uniqueArray(activeCategories);
	},
	
	/**
	 * return all categories records from the predefined categories
	 * @return {Array} of {@link Ext.data.Record Records}
	 * @private
	 */
	getAvailableCategories : function()
	{
		var activeAvailableCategories = [];
		var categoriesGrid = this.getCategoriesGrid();
		var categories = this.getActiveCategories();		
		
		for (var i = 0; i < categories.length; i++) {
			for(var j = 0; j < categoriesGrid.getStore().getCount(); j++) {
				if(categories[i] == categoriesGrid.getStore().getAt(j).get('category')) {
					activeAvailableCategories.push(categoriesGrid.getStore().getAt(j));
					break;
				}
			}
		}
		return activeAvailableCategories;
	},
	
	/**
	 * return all categories records which are not in the predefined categories
	 * @return {Array} The array of categories
	 * @private
	 */
	getActiveExtraCategories : function()
	{
		var activeExtraCategories = [];
		var categoriesGrid = this.getCategoriesGrid();
		var categories = this.getActiveCategories();		
		
		var isActiveCategory = false;
		for (var i = 0; i < categories.length; i++) {
			isActiveCategory = false;
			for(var j = 0; j < categoriesGrid.getStore().getCount(); j++) {
				if(categories[i] == categoriesGrid.getStore().getAt(j).get('category')) {
					isActiveCategory = true;
					break;
				}
			}
			if(!isActiveCategory) {
				//@TODO create and send a record for future use
				activeExtraCategories.push(categories[i]);
			}
		}
		return Zarafa.core.Util.trimStringArray(activeExtraCategories);
	},

	/**
	 * Event handler which is raised when the current selection of the {@link Ext.grid.GridPanel}
	 * changes. This is used to enable/disable the "Add" button.
	 *
	 * @param {RowSelectionModel} selectionModel The selection model which raised the event
	 * @private
	 */
	onSelectionChange : function(selectionModel)
	{
		this.getCategoriesTextArea().setValue('');
		var records = this.getCategoriesGrid().getSelectionModel().getSelections();
		var categories = [];
		
		Ext.each(records, function(record) {
			categories.push(record.get('category'));
		}, this);
		
		this.updateCategories(categories);
	},

	/**
	 * Update the {@link Ext.form.TextArea textarea} with new categories which were selected
	 * from the {@link Ext.grid.GridPanel grid} or from the old values of the
	 * {@link Zarafa.core.data.IPMRecord records}. All categories will be trimmed to remove
	 * extra spaces. Also the categories will be sorted and duplicates will be removed.
	 *
	 * @param {String/String[]} newCategories The categories which must be added
	 * to the {@link Ext.form.TextArea textarea}
	 * @private
	 */
	updateCategories : function(newCategories)
	{
			var categoryInput = this.getCategoriesTextArea();
			var categoryString = categoryInput.getValue();
			var categories = [];

			if(!Ext.isEmpty(newCategories)){
				if(!Ext.isEmpty(categoryString, false)){
					categories = categoryString.split(this.categorySeparator);
					categories = categories.concat(newCategories);
				} else if (Array.isArray(newCategories)) {
					categories = newCategories;
				} else {
					categories = [ newCategories ];
				}
		
			}
		
			var extraCategories = this.getActiveExtraCategories();
			if(extraCategories.length){
				for(var i=0;i<extraCategories.length;i++) {
					categories.push(extraCategories[i]);
				}
			}
		
			categories = Zarafa.core.Util.trimStringArray(categories);
			categories = Zarafa.core.Util.sortArray(categories, 'ASC', Zarafa.core.Util.caseInsensitiveComparison);
			categories = Zarafa.core.Util.uniqueArray(categories);

			categoryString = categories.join(this.categorySeparator + ' ');
			if (categoryString.length > 0) {
				categoryString += this.categorySeparator;
			}

			categoryInput.setValue('');
			categoryInput.setValue(categoryString);
	}
});

Ext.reg('zarafa.categoriespanel', Zarafa.common.categories.dialogs.CategoriesPanel);
