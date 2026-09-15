/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.categories.ui');

/**
 * @class Grommunio.common.categories.ui.CategoryContextMenu
 * @extends Ext.menu.Menu
 * @xtype grommunio.categorycontextmenu
 *
 * The context menu that will be shown when the user right-clicks on a category label
 */
Grommunio.common.categories.ui.CategoryContextMenu = Ext.extend(Ext.menu.Menu, {
	/**
	 * @cfg {Grommunio.core.data.IPMRecord[]} The records to which the actions in
	 * this context menu will apply
	 */
	records: [],

	/**
	 * @cfg {String} The category for which the context menu is shown
	 */
	category: '',

	/**
	 * @cfg {Grommunio.core.data.MAPIStore} store contains {@link #records} on which
	 * categories is going to apply.
	 */
	store: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		this.store = config.records[0].getStore();

		Ext.applyIf(config, {
			xtype: 'grommunio.categorycontextmenu',
			cls: 'grommunio-category-menu',
			items: [
				{
					text: _('Remove') + ' "<span class="k-category-in-menu">' +
							Ext.util.Format.htmlEncode(config.category) +
							'</span>"',
					category: config.category,
					iconCls: 'icon_remove',
					handler: this.onRemoveCategory,
					scope: this,
					listeners: {
						afterrender: this.onAfterRenderRemoveCategoryItem,
						scope: this
					}
				},
				{
					cls: 'k-unclickable',
					text: _('Categories'),
					iconCls: 'icon_categories',
					hideOnClick: false,
					menu: {
						xtype: 'grommunio.categoriescontextmenu',
						records: config.records
					}
				}
			]
		});

		Grommunio.common.categories.ui.CategoriesContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the click event of the "remove category" menu item
	 * @param {Ext.menu.Item} item The menu item that has been clicked
	 */
	onRemoveCategory: function(item)
	{
		var category = Grommunio.common.categories.Util.getCategoryFromHtmlEncoded(item.category, this.records);
		Grommunio.common.categories.Util.removeCategory(this.records, category, true, this.store);
	},

	/**
	 * Event handler for the afterrender event of the "Remove category" menu item. Will
	 * create a {@link Grommunio.common.categories.ui.Tooltip tooltip} for categories that are
	 * truncated.
	 * @param {Ext.menu.Item} item The menu item that has been rendered.
	 */
	onAfterRenderRemoveCategoryItem: function(item)
	{
		new Grommunio.common.categories.ui.Tooltip({
			target: item.el,
			delegate: '.x-menu-item'
		});
	}
});

Ext.reg('grommunio.categorycontextmenu', Grommunio.common.categories.ui.CategoryContextMenu);
