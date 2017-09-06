Ext.namespace('Zarafa.common.categories.ui');

/**
 * @class Zarafa.common.categories.ui.CategoriesContextMenu
 * @extends Ext.menu.Menu
 * @xtype zarafa.categoriescontextmenu
 *
 * The CategoriesContextMenu is the context menu that is shown when the user
 * right clicks on the category icon in the mail grid. It also serves as submenu
 * of the {@link Zarafa.common.categories.ui.CategoryContextMenu CategoryContextMenu}.
 */
Zarafa.common.categories.ui.CategoriesContextMenu = Ext.extend(Ext.menu.Menu, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord[]} The records to which the actions in
	 * this context menu will apply
	 */
	records : [],

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

		if(!Array.isArray(config.records)) {
			this.records = [config.records];
		} else {
			this.records = config.records;
		}
		this.store = this.records[0].getStore();

		Ext.applyIf(config, {
			xtype: 'zarafa.categoriescontextmenu',
			cls: 'k-categories',
			items: [
				this.createCategoryItems(),
				{ xtype: 'menuseparator' },
				{
					text: _('Manage Categories'),
					cls: 'k-manage-categories',
					handler: function() {
						Zarafa.common.Actions.openCategoriesContent(this.records);
					},
					scope: this
				}
			],
			listeners : {
				afterrender: this.onAfterRenderCategoriesMenu,
				scope: this
			}
		});

		Zarafa.common.categories.ui.CategoriesContextMenu.superclass.constructor.call(this, config);
	},

	/**
	 * Create the categories submenu
	 * @return {Ext.menu.Item[]} The list of menu items of
	 * the categories menu
	 * @private
	 */
	createCategoryItems : function()
	{
		var categoriesStore = new Zarafa.common.categories.data.CategoriesStore();
		// Add categories that are set on the record(s) but don't exist in the categoryStore
		categoriesStore.addCategoriesFromMapiRecords(this.records);

		// Only show the quick access categories and selected categories in the submenu
		var selectedCategories = Zarafa.common.categories.Util.getAllCategories(this.records);
		categoriesStore.filterBy(function(category){
			return category.get('quickAccess') || selectedCategories.indexOf(category.get('category'))>-1;
		});

		// Map all categories to a config object for a menu item
		return categoriesStore.getRange().map(function(category){
			return {
				text: '<span class="k-category-in-menu">' + Ext.util.Format.htmlEncode(category.get('category')) + '</span>',
				plainText: category.get('category'),
				color: category.get('color'),
				handler: this.onCategoryMenuItemClick,
				listeners: {
					beforerender: this.onBeforeRenderCategoriesMenuItem,
					afterrender: this.onAfterRenderCategoriesMenuItem,
					scope: this
				},
				scope: this
			};
		}.bind(this));
	},

	/**
	 * Event handler for the afterrender event of the "Remove category" menu item. Will
	 * create a {@link Zarafa.common.categories.ui.Tooltip tooltip} for categories that are
	 * truncated.
	 * @param {Ext.menu.Item} item The menu item that has been rendered.
	 */
	onAfterRenderCategoriesMenu : function(item)
	{
		new Zarafa.common.categories.ui.Tooltip({
			target: item.el,
			delegate: '.k-category-in-menu'
		});
	},

	/**
	 * Event handler for the beforerender event of the items in the categories submenu. If the
	 * category is set on all selected records, a css class will be added to the menu item.
	 * @param {Ext.menu.Item} item The item of the categories submenu
	 * that is about to be rendered
	 */
	onBeforeRenderCategoriesMenuItem : function(item)
	{
		var selectedCategories = Zarafa.common.categories.Util.getCommonCategories(this.records);
		if ( selectedCategories.indexOf(item.plainText)>-1 ){
			item.cls = 'x-menu-item-selected';
			item.selected = true;
		} else {
			item.cls = '';
			item.selected = false;
		}
	},

	/**
	 * Event handler for the afterrender event of the items in the categories submenu. It
	 * will add an svg icon with the category color to the menu item.
	 * @param {Ext.menu.Item} item The item of the categories submenu
	 * that was just rendered
	 */
	onAfterRenderCategoriesMenuItem : function(item)
	{
		var icon = item.el.down('img');
		var svgIcon = Zarafa.common.categories.Util.getCategoryIconSVG(item.color);
		Ext.DomHelper.insertHtml('beforeBegin', icon.dom, svgIcon);
	},

	/**
	 * Event handler for the items in the categories submenu. Will add, rename or remove the
	 * clicked category to/from all selected records. function will be shows
	 * {@link Zarafa.common.categories.dialogs.RenameCategoryPanel RenameCategoryPanel} when
	 * standard categories(Red, Green etc.) are selected first time.
	 *
	 * @param {Ext.menu.Item} item The item of the categories submenu
	 * that was clicked
	 */
	onCategoryMenuItemClick : function(item)
	{
		if ( item.selected ){
			// Remove this category from all records
			Zarafa.common.categories.Util.removeCategory(this.records, item.plainText, true);
		} else {
			var categories  = container.getPersistentSettingsModel().get('kopano/main/categories');
			var category = categories.find(function (category) {
				if(!Ext.isEmpty(category.standardIndex) && (category.name === item.plainText)){
					return category;
				}
			});

			if(Ext.isDefined(category) && !category.used) {
				Zarafa.common.Actions.openRenameCategoryContent({
					categoryName : category.name,
					records : this.records,
					color : item.color,
					recordStore : this.store
				});
			} else {
				// Add this category to all records that don't have it yet'
				Zarafa.common.categories.Util.addCategory(this.records, item.plainText, true, this.store);
			}
		}
	}
});

Ext.reg('zarafa.categoriescontextmenu', Zarafa.common.categories.ui.CategoriesContextMenu);
