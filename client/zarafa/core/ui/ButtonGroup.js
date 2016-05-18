Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.ButtonGroup
 * @extends Ext.ButtonGroup
 * @xtype zarafa.buttongroup
 */
Zarafa.core.ui.ButtonGroup = Ext.extend(Ext.ButtonGroup, {
	/**
	 * @constructor
	 * @param config
	 */
	constructor : function(config)
	{
		Ext.apply(this, config, {
			xtype: 'zarafa.buttongroup'
		});

		Zarafa.core.ui.ButtonGroup.superclass.constructor.call(this, config);
	},

	/**
	 * Function will check whether buttongroup has any visible buttons or not.
	 *
	 * @return {Boolean} function will return true if buttonGroups has any visible items,
	 * It will return false if buttonGroup is empty or buttonGroup has all hidden buttons.
	 */
	hasVisibleButtons : function()
	{
		var buttonsArray = this.items.getRange();
		if(!Ext.isEmpty(buttonsArray)){
			for (var i = 0; i < buttonsArray.length; i++)
			{
				//isVisible function is not working properly in current version of ExtJs.
				if(buttonsArray[i].hidden === false) {
					return true;
				}
			}
		}
		return false;
	}
});

Ext.reg('zarafa.buttongroup', Zarafa.core.ui.ButtonGroup);
