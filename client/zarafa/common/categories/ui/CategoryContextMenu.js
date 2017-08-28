Ext.namespace('Zarafa.common.categories.ui');

/**
 * @class Zarafa.common.categories.ui.CategoryContextMenu
 * @extends Ext.menu.Menu
 * @xtype zarafa.categorycontextmenu
 *
 * The context menu that will be shown when the user right-clicks on a category label
 */
Zarafa.common.categories.ui.CategoryContextMenu = Ext.extend(Ext.menu.Menu, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} The records to which the actions in
	 * this context menu will apply
	 */
	records : [],

	/**
	 * @cfg {String} The category for which the context menu is shown
	 */
	category : '',

	/**
	 * @cfg {Zarafa.core.data.MAPIStore} store contains {@link #records} on which
	 * categories is going to apply.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		this.store = config.records[0].getStore();

		Ext.applyIf(config, {
			xtype: 'zarafa.categorycontextmenu',
			cls: 'zarafa-category-menu',
			items: [
				{
					text: _('Remove') + ' "<span class="k-category-in-menu">' +
							Ext.util.Format.htmlEncode(config.category) +
							'</span>"',
					category: config.category,
					iconCls : 'icon_remove',
					handler : this.onRemoveCategory,
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
						xtype: 'zarafa.categoriescontextmenu',
						records: config.records
					}
				}
			]
		});

		Zarafa.common.categories.ui.CategoriesContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the click event of the "remove category" menu item
	 * @param {Ext.menu.Item} item The menu item that has been clicked
	 */
	onRemoveCategory : function(item)
	{
		var category = Zarafa.common.categories.Util.getCategoryFromHtmlEncoded(item.category, this.records);
		Zarafa.common.categories.Util.removeCategory(this.records, category, true, this.store);
	},

	/**
	 * Event handler for the afterrender event of the "Remove category" menu item. Will
	 * create a {@link Zarafa.common.categories.ui.Tooltip tooltip} for categories that are
	 * truncated.
	 * @param {Ext.menu.Item} item The menu item that has been rendered.
	 */
	onAfterRenderRemoveCategoryItem : function(item)
	{
		new Zarafa.common.categories.ui.Tooltip({
			target: item.el,
			delegate: '.x-menu-item'
		});
	}
});

Ext.reg('zarafa.categorycontextmenu', Zarafa.common.categories.ui.CategoryContextMenu);
