Ext.namespace('Zarafa.common.ui.grid');

/**
 * @class Zarafa.common.ui.grid.DateTooltip
 * @extends Ext.ToolTip
 * @xtype zarafa.griddatetooltip
 *
 * Tooltip for 'nice' formatted dates in grids.
 * The tooltip will show the full date and time.
 */
Zarafa.common.ui.grid.DateTooltip = Ext.extend(Ext.ToolTip, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.griddatetooltip',
			cls: 'k-griddatetooltip',
			delegate: '.k-date-nice',
			dismissDelay: 0,
			trackMouse: true,
			renderTo: Ext.getBody(),
			listeners: {
				beforeshow: this.onBeforeshow,
				scope: this
			}
		});

		Zarafa.common.ui.grid.DateTooltip.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler for the beforeshow event of the tooltip. Will update
	 * the contents of the tooltip
	 * @param (Ext.ToolTip) tooltip The category tooltip
	 */
	onBeforeshow : function(tooltip)
	{
		// Get the timestamp from the 'k-ts-' class
		var timestamp;
		tooltip.anchorTarget.classList.forEach(function(cls){
			if ( cls.substr(0, 5) === 'k-ts-' ){
				timestamp = parseInt(cls.substr(5));
			}
		});

		var dateString = (new Date(timestamp)).format(_('D, d-m-Y, G:i'));

        tooltip.body.dom.innerHTML = Ext.util.Format.htmlEncode(dateString);
	}
});

Ext.reg('zarafa.griddatetooltip', Zarafa.common.ui.grid.DateTooltip);
