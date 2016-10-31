Ext.namespace('Zarafa.common.categories.dialogs');

/**
 * @class Zarafa.common.categories.dialogs.NewCategoryPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.newcategorypanel
 *
 * This content panel is used to create new categories.
 */
Zarafa.common.categories.dialogs.NewCategoryPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.common.categories.data.CategoriesStore} When this dialog is created from a
	 * {@link Zarafa.common.categories.dialogs.CategoriesContentPanel} this property will contain
	 * the store of that panel.
	 */
	store : null,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.newcategorypanel',
			title : _('Create New Category'),
			cls: 'k-newcategorypanel',
			width: 250,
			height: 120,
			layout: 'fit',
			items: [{
				xtype: 'form',
				border: false,
				ref: 'formPanel',
				items: [{
					xtype: 'zarafa.compositefield',
					hideLabel: true,
					items: [{
						xtype: 'zarafa.colorpicker',
						hideLabel: true,
						name: 'color',
						ref: '../color',
						border: false
					},{
						xtype: 'textfield',
						name: 'name',
						ref: '../name',
						hideLabel: true,
						anchor: '100%',
						flex: 1,
						enableKeyEvents: true,
						listeners: {
							specialkey: this.onSpecialKey,
							keydown: this.onKeyDown,
							scope: this
						}
					}]
				},{
					xtype: 'checkbox',
					name: 'pin',
					ref: 'pin',
					ctCls: 'k-pin-check',
					hideLabel: true,
					boxLabel: _('Pin to quick access')
				}],
				buttons: [{
					text: _('Create'),
					handler: this.onCreate,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Zarafa.common.categories.dialogs.NewCategoryPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the specialkey event. Will check if the user pressed ENTER and if
	 * so call the event handler for the create button
	 *
	 * @param {Ext.form.TextField} field The textfield for the name of the new category
	 * @param {Ext.EventObject} event Object with event data
	 */
	onSpecialKey : function(field, event)
	{
		if ( event.getKey() === event.ENTER ){
			event.preventDefault();
			this.onCreate();
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
		if ( key === ';' || key === ',' ){ // Don't allow ; or , in a category name
			event.preventDefault();
		}
	},

	/**
	 * Event handler for the "create" button. Will check if the category does not
	 * exist yet, and create and save the new category. Will also update the grid
	 * of the manage categories dialog.
	 */
	onCreate : function()
	{
		var categoryName = this.formPanel.name.getValue().trim();
		// Don't allow empty category names
		if ( Ext.isEmpty(categoryName) ){
			return;
		}

		if ( !this.canCreateNewCategory(categoryName) ){
			return;
		}

		var categoryStore = new Zarafa.common.categories.data.CategoriesStore();
		var categoryColor = this.formPanel.color.getValue();
		var quickAccess = this.formPanel.pin.getValue();

		// Add the new category to our temporary store and use it to save it.
		categoryStore.addCategory(categoryName, categoryColor, quickAccess);
		categoryStore.save();

		// Also add the new category to the store of the grid in the manage category dialog
		if ( Ext.isDefined(this.store) ){
			this.store.addCategory(categoryName, categoryColor, quickAccess);

			// scroll the new category into view, put the focus on it and select it
			var rowIndex = this.store.findExact('category', categoryName);
			this.grid.getView().focusRow(rowIndex);
			this.grid.getSelectionModel().selectRow(rowIndex, true);
		}

		// Update the categoriesStore in Zarafa.common.categories.Util to make sure
		// the rendering is up to date.
		Zarafa.common.categories.Util.loadCategoriesStore();

		this.close();
	},

	/**
	 * Event handler for the click event of the Cancel button. Closes the dialog.
	 */
	onCancel : function()
	{
		this.close();
	},

	/**
	 * Checks if we can create a new category with the given name. Will show an error message
	 * to the user if it is not possible.
	 * @param {String} categoryName The name of the category that we try to create
	 * @return {Boolean} True if the category can be created, false otherwise.
	 */
	canCreateNewCategory : function(categoryName)
	{
		var categoryStore = new Zarafa.common.categories.data.CategoriesStore();

		// Check if the category does not exist yet (case insensitive)
		var catIndex = categoryStore.findExactCaseInsensitive('category', categoryName);
		var catGridIndex = this.store.findExactCaseInsensitive('category', categoryName);
		var matchingCategory;

		var errorMessage;
		if ( catIndex !== -1 ){
			if ( catGridIndex === -1 ){
				// User deleted or renamed the category in the manage categories dialog
				errorMessage = _('You must apply the changes you have made to the categories before you can create this category.');
			} else {
				matchingCategory = categoryStore.getAt(catIndex);
				errorMessage = String.format(
					_("You already have a category named '{0}'. Please use another name."),
					Ext.util.Format.htmlEncode(matchingCategory.get('category'))
				);
			}
		} else if ( catGridIndex !== -1 ){
			matchingCategory = this.store.getAt(catGridIndex);
			errorMessage = String.format(
				_("You already have a category named '{0}' in your pending changes. Please use another name."),
				Ext.util.Format.htmlEncode(matchingCategory.get('category'))
			);
		}

		// If we have an error we will show a message to the user and will return without creating the new category
		if ( !Ext.isEmpty(errorMessage) ){
			// show error message
			this.showErrorMessage(errorMessage);
			return false;
		}

		return true;
	},

	/**
	 * Shows an error message to the user
	 * @param {String} msg The error message that will be shown
	 */
	showErrorMessage : function(msg)
	{
		// Make sure the MessageBox can get big enough
		var maxWidth = Zarafa.common.dialogs.MessageBox.maxWidth;
		Zarafa.common.dialogs.MessageBox.maxWidth = 350;

		Zarafa.common.dialogs.MessageBox.alert(
			_('Rename Category'),
			msg,
			function(){
				// Set the normal width of the MessageBox back
				Zarafa.common.dialogs.MessageBox.maxWidth = maxWidth;
				this.formPanel.name.focus();
			},
			this
		);
	}
});

Ext.reg('zarafa.newcategorypanel', Zarafa.common.categories.dialogs.NewCategoryPanel);
