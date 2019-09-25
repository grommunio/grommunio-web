Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SearchCategoriesContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.searchcategoriescontentpanel
 *
 * ContentPanel for users to add/remove the categories into category filter.
 */
Zarafa.advancesearch.dialogs.SearchCategoriesContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {

	/**
	 * @cfg {Zarafa.advancesearch.data.SearchCategoriesStore} store The store which contain categories,
	 * That added in category filter.
	 */
	searchCategoryStore: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration structure
	 */
	constructor: function (config)
	{
		config = config || {};

		// Create dummy ext data record with 'categories' field with category string.
		if (Ext.isEmpty(config.record) && Ext.isDefined(config.searchCategoryStore)) {
			var categories = config.searchCategoryStore.getCategories();
			config.record = new Ext.data.Record({
				'categories': categories.join("; ")
			});
		}

		config = Ext.applyIf(config, {
			xtype: 'zarafa.searchcategoriescontentpanel',
			layout: 'fit',
			title: _('Select Category'),
			width: 400,
			height: 400,
			items: [{
				xtype: 'zarafa.categoriespanel',
				record: config.record,
				ref: 'categoriesPanel',
				hideActionButtons : true,
				buttons: [{
					text: _('Apply'),
					handler: this.onApply,
					scope: this
				}, {
					text: _('Cancel'),
					handler: this.close,
					scope: this
				}]
			}]
		});

		Zarafa.advancesearch.dialogs.SearchCategoriesContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Apply" {@link Ext.Button button}
	 * This will add selected categories to {@link #searchCategoryStore store}
	 * and will close the panel.
	 * @private
	 */
	onApply: function ()
	{
		var categories = this.categoriesPanel.getSelectedCategories();
		var existingCategories = this.searchCategoryStore.getCategories();

		// Find removed categories (unchecked by user) and remove this from {@link #searchCategoryStore store}.
		var removedCategories = existingCategories.filter(
			function (category) {
				return categories.indexOf(category);
			});
		if (!Ext.isEmpty(removedCategories)) {
			this.searchCategoryStore.removeCategories(removedCategories);
		}

		this.searchCategoryStore.addCategories(categories);
		this.close();
	}
});

Ext.reg('zarafa.searchcategoriescontentpanel', Zarafa.advancesearch.dialogs.SearchCategoriesContentPanel);
