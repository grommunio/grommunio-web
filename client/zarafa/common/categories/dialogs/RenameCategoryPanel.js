Ext.namespace('Zarafa.common.categories.dialogs');

/**
 * @class Zarafa.common.categories.dialogs.RenameCategoryPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.renamecategorypanel
 *
 * This content panel is used to rename the categories.
 */
Zarafa.common.categories.dialogs.RenameCategoryPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.common.categories.data.CategoriesStore} store categories store which
	 * contains the categories. default is null.
	 */
	store : null,

	/**
	 * @cfg {Boolean} isCategoryGrid When this dialog is created from a
	 * {@link Zarafa.common.categories.dialogs.CategoriesContentPanel} this property will be true
	 * else false.
	 */
	isCategoryGrid : false,

	/**
	 * @cfg {String} color Default color which requires to show in
	 * {@link Zarafa.common.ui.ColorPicker ColorPicker} when
	 * this dialog is instantiated.
	 */
	color : undefined,

	/**
	 * @cfg {String} categoryName Default category name which requires to show in text field
	 * when this dialog is instantiated.
	 */
	categoryName : undefined,

	/**
	 * @cfg {Zarafa.core.data.IPMStore} recordStore store which
	 * contains the {@link Zarafa.core.data.MAPIRecord record} on which
	 * category is going to apply. default is undefined.
	 */
	recordStore : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (Ext.isEmpty(config.store)) {
			config.store = new Zarafa.common.categories.data.CategoriesStore();
		}

		Ext.applyIf(config, {
			xtype: 'zarafa.renamecategorypanel',
			title : _('Rename Category'),
			cls: 'k-renamecategorypanel',
			width: 369,
			height: 120,
			layout: 'fit',
			items: [{
				xtype: 'form',
				border: false,
				ref: 'formPanel',
				items: [{
					xtype: 'displayfield',
					html : this.getDisplayText(config.categoryName),
					htmlEncode : true,
					hideLabel : true
				},{
					xtype: 'zarafa.compositefield',
					hideLabel: true,
					items: [{
						xtype: 'zarafa.colorpicker',
						hideLabel: true,
						name: 'color',
						ref: '../color',
						border: false,
						value : config.color
					},{
						xtype: 'textfield',
						name: 'name',
						ref: '../name',
						hideLabel: true,
						anchor: '100%',
						selectOnFocus : true,
						flex: 1,
						value : config.categoryName,
						enableKeyEvents: true,
						listeners: {
							specialkey: this.onSpecialKey,
							keydown: this.onKeyDown,
							scope: this
						}
					}]
				}],
				buttons: [{
					text: _('Rename'),
					handler: this.onRename,
					scope: this
				},{
					text: _('No'),
					handler: this.onClickNo,
					scope: this
				}]
			}]
		});

		Zarafa.common.categories.dialogs.RenameCategoryPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function which compose message for rename dialog.
	 *
	 * @param {String} category category name which is used in message composition.
	 * @returns {String} return message for the rename dialog.
	 */
	getDisplayText : function (category)
	{
		var message = String.format(_('This is the first time you have used "{0}" category.'), category);
		message += '<BR/>';
		message += _('Do you want to rename it?');

		return message;
	},

	/**
	 * Event handler for the specialkey event. Will check if the user pressed ENTER and if
	 * so call the event handler for the rename button
	 *
	 * @param {Ext.form.TextField} field The textfield for the name of the new category
	 * @param {Ext.EventObject} event Object with event data
	 */
	onSpecialKey : function(field, event)
	{
		if ( event.getKey() === event.ENTER ){
			event.preventDefault();
			this.onRename();
		}
	},

	/**
	 * Event handler for the keydown event. Will prevent the user pressing COMMA or SEMICOLON,
	 * because we will not allow those characters in category names.
	 *
	 * @param {Ext.form.TextField} field The textfield for the name of the new category
	 * @param {Ext.EventObject} event Object with event data
	 */
	onKeyDown : function(field, event)
	{
		var key = event.browserEvent.key;
		if ( key === ';' || key === ',' ){
			event.preventDefault();
		}
	},

	/**
	 * Function which used to find the categories from
	 * {@link Zarafa.common.categories.data.CategoriesStore CategoriesStore}.
	 *
	 * @param {String} categoryName The category name which used to find
	 * from {@link Zarafa.common.categories.data.CategoriesStore CategoriesStore}.
	 * @return {Object} return if found then return categories object else undefined.
	 */
	findCategory : function(categoryName) {
		var categoryIndex = this.store.findExactCaseInsensitive('category', categoryName);
		return this.store.getAt(categoryIndex);
	},

	/**
	 * Event handler for the "Rename" button. which rename selected
	 * category by calling {@link #doRenameCategory} and also it Will
	 * show the {@link #showWarningMessage message box} if category already exist yet.
	 */
	onRename : function()
	{
		var categoryName = this.formPanel.name.getValue().trim();
		// Don't allow empty category names
		if ( Ext.isEmpty(categoryName)){
			return;
		}
		// check that category already exist in category store.
		// if it is exist then show message box else
		// call doRenameCategory function to rename the category.
		var foundCategory = this.findCategory(categoryName);
		if(this.formPanel.name.isDirty() && foundCategory !== undefined) {
			var msg = String.format(_('The category "{0}" already exists. Do you want to merge the "{1}" and "{2}" categories?'),
				foundCategory.get('category'), this.categoryName, foundCategory.get('category'));
				this.showWarningMessage(msg);
		} else {
			var categoryRecord = this.findCategory(this.categoryName);
			this.doRenameCategory(categoryRecord, categoryName);
			this.close();
		}
	},

	/**
	 * Event handler for the click event of the No button. Closes the dialog.
	 */
	onClickNo : function()
	{
		var category = this.findCategory(this.categoryName);
		category.set('used', true);
		category.commit();
		this.store.save();
		Zarafa.common.categories.Util.addCategory(this.records, this.categoryName, true, this.recordStore);
		this.close();
	},

	/**
	 * Shows a warning message to the user.
	 * @param {String} msg The warning message that will be shown
	 */
	showWarningMessage : function(msg)
	{
		Zarafa.common.dialogs.MessageBox.addCustomButtons({
			title : _('Categories'),
			msg : msg,
			icon: Ext.MessageBox.QUESTION,
			fn : function(button) {
				if (button === 'merge') {
					this.onMergeCategory();
				} else {
					this.formPanel.name.focus();
				}
			},
			customButton : [{
				text : _('Merge'),
				name : 'merge'
			}, {
				text : _('No'),
				name : 'no'
			}],
			scope: this
		});
	},

	/**
	 * Function which is used to merge the categories.
	 */
	onMergeCategory : function()
	{
		var newCategoryName = this.formPanel.name.getValue().trim();
		var category = this.findCategory(newCategoryName);
		this.store.remove(category);

		// If merging category is standard category then
		// save it into merged_categories object of persistent setting model.
		if(!Ext.isEmpty(category.get('standardIndex'))) {
			container.getPersistentSettingsModel().set('kopano/main/merged_categories/'+category.get('standardIndex'), category.get('category'));
		}
		var categoryRecord = this.findCategory(this.categoryName);
		this.doRenameCategory(categoryRecord, category.get('category'));
		this.close();
	},

	/**
	 * Function which is used to rename the selected category and
	 * reload the {@link Zarafa.common.categories.data.CategoriesStore CategoriesStore}.
	 *
	 * @param {Ext.data.Record} categoryRecord record which is going to rename.
	 * @param {String} categoryName new name which is apply to selected category.
	 */
	doRenameCategory : function (categoryRecord, categoryName)
	{
		categoryRecord.set('category', categoryName);
		categoryRecord.set('used', true);
		if(this.formPanel.color.isDirty()) {
			categoryRecord.set('color', '#'+this.formPanel.color.getValue());
		}
		categoryRecord.commit();
		this.store.save();

		Zarafa.common.categories.Util.loadCategoriesStore();

		// Don't apply category on record as this dialog is called
		// from managed category dialog. As managed category dialog
		// apply category on record by click on apply button
		if(!this.isCategoryGrid) {
			Zarafa.common.categories.Util.addCategory(this.records, categoryName, true, this.recordStore);
		}
		Zarafa.common.categories.Util.updateStoresAfterCategoryUpdate();
	}
});

Ext.reg('zarafa.renamecategorypanel', Zarafa.common.categories.dialogs.RenameCategoryPanel);

