/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.advancesearch.dialogs');

/**
 * @class Grommunio.advancesearch.dialogs.SearchCategoriesContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.searchcategoriescontentpanel
 *
 * ContentPanel for users to add/remove the categories into category filter.
 */
Grommunio.advancesearch.dialogs.SearchCategoriesContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {

	/**
	 * @cfg {Grommunio.advancesearch.data.SearchCategoriesStore} store The store which contain categories,
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
			xtype: 'grommunio.searchcategoriescontentpanel',
			layout: 'fit',
			title: _('Select Category'),
			width: 400,
			height: 400,
			items: [{
				xtype: 'grommunio.categoriespanel',
				record: config.record,
				ref: 'categoriesPanel',
				hideActionButtons: true,
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

		Grommunio.advancesearch.dialogs.SearchCategoriesContentPanel.superclass.constructor.call(this, config);
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
		var removedCategories = existingCategories.filter(function (category) {
			return categories.indexOf(category) === -1;
		});
		if (!Ext.isEmpty(removedCategories)) {
			this.searchCategoryStore.removeCategories(removedCategories);
		}

		this.searchCategoryStore.addCategories(categories);
		this.close();
	}
});

Ext.reg('grommunio.searchcategoriescontentpanel', Grommunio.advancesearch.dialogs.SearchCategoriesContentPanel);
