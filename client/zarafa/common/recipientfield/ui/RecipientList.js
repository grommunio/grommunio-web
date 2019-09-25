Ext.namespace('Zarafa.common.recipientfield.ui');

/**
 * @class Zarafa.common.recipientfield.ui.RecipientList
 * @extends Zarafa.common.recipientfield.ui.RecipientField
 * @xtype zarafa.recipientlist
 * This extends the {@link Zarafa.common.recipientfield.ui.RecipientField RecipientField}
 * and transforms the boxes into a large list.
 */
Zarafa.common.recipientfield.ui.RecipientList = Ext.extend(Zarafa.common.recipientfield.ui.RecipientField, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			boxType : 'zarafa.recipientbox',
			boxConfig : {
				height : config.inputFieldHeight || this.inputFieldHeight
			},
			listMode : true,
			autoHeight: true,
			autoScroll: false
		});

		Zarafa.common.recipientfield.ui.RecipientList.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.recipientlist', Zarafa.common.recipientfield.ui.RecipientList);
