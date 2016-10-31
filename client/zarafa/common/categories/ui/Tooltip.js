Ext.namespace('Zarafa.common.categories.ui');

/**
 * @class Zarafa.common.categories.ui.Tooltip
 * @extends Ext.ToolTip
 * @xtype zarafa.categoriestooltip
 *
 * Tooltip for category blocks that are truncated because they are too long.
 * The tooltip will show the full category name.
 */
Zarafa.common.categories.ui.Tooltip = Ext.extend(Ext.ToolTip, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.categoriestooltip',
			target: Ext.get(document.body), // Should be overriden when creating this component
			delegate: '.k-category-block',
			dismissDelay: 0,
			trackMouse: true,
			renderTo: Ext.getBody(),
			listeners: {
				beforeshow: this.onBeforeshow,
				scope: this
			}
		});

		Zarafa.common.categories.ui.Tooltip.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the beforeshow event of the categoryTooltip. Will update
	 * the contents of the category tooltip if necessary or return false to not
	 * show the tooltip otherwise.
	 * @param (Ext.ToolTip) tooltip The category tooltip
	 * @return {Boolean|undefined} False if the tooltip should not be shown,
	 * undefined otherwise
	 */
	onBeforeshow : function(tooltip)
	{
		// Don't show the tooltip for categories that aren't truncated
    	if ( !this.isCategoryNameTruncated(tooltip.triggerElement) ){
    		return false;
    	}

        tooltip.body.dom.innerHTML = Ext.util.Format.htmlEncode(tooltip.triggerElement.textContent);
	},

	/**
	 * Will check if a category name is truncated or not
	 * @param {HTMLElement} categoryEl The category element that needs to be checked
	 * for truncation.
	 * @return {Boolean} True if the category name is truncated, false otherwise
	 */
	isCategoryNameTruncated : function(categoryEl)
	{
		return categoryEl.offsetWidth < categoryEl.scrollWidth;
	}
});

Ext.reg('zarafa.categoriestooltip', Zarafa.common.categories.ui.Tooltip);
