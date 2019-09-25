Ext.namespace('Zarafa.core.ui.menu');

/**
 * @class Zarafa.core.ui.menu.ConditionalItem
 * @extends Ext.menu.Item
 * @xtype zarafa.conditionalitem
 *
 * Extends the {@link Ext.menu.Item} class and will check if the
 * item should be enabled or disabled each time before the
 * context menu is being shown.
 */
Zarafa.core.ui.menu.ConditionalItem = Ext.extend(Ext.menu.Item, {
	/**
	 * @cfg {Boolean} hideOnDisabled This item must be hidden rather
	 * then be marked disabled.
	 */
	hideOnDisabled : true,
	/**
	 * @cfg {Boolean} emptySelectOnly This item must only be enabled
	 * if no record is selected
	 */
	emptySelectOnly : false,
	/**
	 * @cfg {Boolean} nonEmptySelectOnly This item must only be enabled
	 * if one or more records are selected
	 */
	nonEmptySelectOnly : false,
	/**
	 * @cfg {Boolean} singleSelectOnly This item must only be enabled
	 * if a single record is selected
	 */
	singleSelectOnly : false,
	/**
	 * @cfg {Boolean} multiSelectOnly This item must only be enabled
	 * if multiple records are selected.
	 */
	multiSelectOnly : false,
	/**
	 * Override of {@link Ext.menu.Item#itemTpl} to add the possibility of
	 * styling the icon.
	 * @property
	 * @Type Ext.XTemplate
	 */
    itemTpl : new Ext.XTemplate(
        '<a id="{id}" class="{cls} x-unselectable" hidefocus="true" unselectable="on" href="{href}"',
            '<tpl if="hrefTarget">',
                ' target="{hrefTarget}"',
            '</tpl>',
         '>',
             '<img alt="{altText}" src="{icon}" class="x-menu-item-icon {iconCls}" {iconStyle}/>',
             '<span class="x-menu-item-text">{text}</span>',
         '</a>'
    ),
    /**
     * Override of {@link Ext.menu.Item#getTemplateArgs} to add the possibility of
     *  styling the icon.
     * @return {Object}
     */
    getTemplateArgs: function() {
    	// Get the original template arguments from the original function
    	var templateArgs = Zarafa.core.ui.menu.ConditionalItem.superclass.getTemplateArgs.call(this);
    	// Add the argument for the icon style
    	templateArgs.iconStyle = this.iconBG ? 'style="background-color:'+this.iconBG+';"' : '';
		return templateArgs;
	},
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.applyIf(config, {
			xtype : 'zarafa.conditionalitem'
		});

		Ext.applyIf(this, config);

		Zarafa.core.ui.menu.ConditionalItem.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the component
	 * @private
	 */
	initComponent : function()
	{
		Zarafa.core.ui.menu.ConditionalItem.superclass.initComponent.apply(this, arguments);

		// Reset the enable/disable functions to their
		// show/hide counterparts if we should not display the item as disabled.
		if (this.hideOnDisabled) {
			this.enable = this.show;
			this.disable = this.hide;
		}
	},

	/**
	 * Apply the {@link #emptySelectOnly}, {@link #nonEmptySelectOnly}, {@link #singleSelectOnly}
	 * and {@link #multiSelectOnly} filters to determine if the item must be {@link #setDisabled disabled}
	 * or not.
	 * @private
	 */
	applySelectionFilter : function()
	{
		var records = this.getRecords();

		if (this.emptySelectOnly) {
			if (Ext.isDefined(records) && (!Array.isArray(records) || records.length > 0)) {
				this.setDisabled(true);
			} else {
				this.setDisabled(false);
			}
		}

		if (this.nonEmptySelectOnly) {
			if (Ext.isDefined(records) && Array.isArray(records) && records.length === 0) {
				this.setDisabled(true);
			} else {
				this.setDisabled(false);
			}
		}

		if (this.singleSelectOnly) {
			if (!Ext.isDefined(records) || (Array.isArray(records) && records.length !== 1)) {
				this.setDisabled(true);
			} else {
				this.setDisabled(false);
			}
		}

		if (this.multiSelectOnly) {
			if (!Ext.isDefined(records) || !Array.isArray(records) || records.length === 1) {
				this.setDisabled(true);
			} else {
				this.setDisabled(false);
			}
		}
	},

	/**
	 * Called by the {@link #parentMenu} when it is about to be shown, this can be
	 * overridden by subclasses to add extra filters on the visibility of this item.
	 * @param {Zarafa.core.ui.menu.ConditionalItem} item The item which is about to be shown.
	 * @param {Zarafa.core.data.MAPIRecord} record The record which is being shown for this menu
	 */
	beforeShow : function(item, record)
	{
		item.applySelectionFilter();
	},

	/**
	 * Obtain the record/records which are attached to the {@link Zarafa.core.ui.menu.ConditionalMenu menu}
	 * to which this item belongs.
	 * @return {Zarafa.core.data.MAPIRecord[]} records
	 */
	getRecords : function()
	{
		return this.getRootMenu().records;
	},

	/**
	 * Obtain the reference to the root menu.
	 * This will go through all parents of the {@link Zarafa.core.ui.ConditionalItem item}
	 * until no {@link Ext.menu.menu} is found as parent. The last parent is considered the
	 * root and will be returned to the caller.
	 *
	 * @return {Ext.menu.menu} The Root menu object
	 */
	getRootMenu : function()
	{
		var menu = this.parentMenu;
		if (!menu && this.ownerCt instanceof Ext.menu.Menu) {
			menu = this.ownerCt;
		}

		while (menu && (Ext.isDefined(menu.parentMenu) || menu.ownerCt instanceof Ext.menu.Menu)) {
			menu = menu.parentMenu || menu.ownerCt;
		}

		return menu;
	}
});

Ext.reg('zarafa.conditionalitem', Zarafa.core.ui.menu.ConditionalItem);
