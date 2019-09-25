Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.ui.MemberBox
 * @extends Zarafa.common.recipientfield.ui.RecipientBox
 * @xtype zarafa.memberbox
 *
 * Special {@link Zarafa.common.ui.Box box} which is used
 * for displaying Distlist Member records in the {@link Zarafa.contact.ui.MemberBoxField}.
 * This works similar to the {@link Zarafa.common.recipientfield.ui.RecipientBox} regarding
 * resolving, but it will mark any non-distlist member user as invalid.
 */
Zarafa.contact.ui.MemberBox = Ext.extend(Zarafa.common.recipientfield.ui.RecipientBox, {
	/**
	 * Check if the given {@link Ext.data.Record record} is valid. This function can be
	 * overridden by the childclasses to indicate if the given record is valid.
	 *
	 * This class will check if the distlist_type is valid.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to check
	 * @return {Boolean} True if the record is valid
	 * @protected
	 */
	isValidRecord : function(record)
	{
		var distlistType = record.get('distlist_type');

		if(Ext.isDefined(Zarafa.core.mapi.DistlistType.getName(distlistType))) {
			return true;
		}

		return false;
	},

	/**
	 * Function which can be overriden to provide custom formatting for the given {@link Ext.data.Record}
	 * to the {@link #update} function. The data object returned here is used by the {@link #textTpl template}
	 * to render the contents of the box.
	 * @param {Ext.data.Record} record The record which is going to be rendered
	 * @return {Object} The data object which can be passed to {@link #textTpl}.
 	 * @private
	 */
	prepareData: function(record)
	{
		var prepared = Zarafa.contact.ui.MemberBox.superclass.prepareData.apply(this, arguments);

		prepared.distlist_type = record.get('distlist_type');

		return prepared;
	},

	/**
	 * Function which can be overriden to provide custom icon rendering for the given {@link Ext.data.Record}
	 * to the {@link #iconEl} element. The string returned here is the CSS class which will be set on the
	 * {@link #iconEl}.
	 * @param {Ext.data.Record} record The record which is going to be rendered
	 * @return {String} The CSS class which must be applied to the {@link #iconEl}.
	 * @private
	 */
	prepareIcon : function(record)
	{
		if (this.isValidRecord(record)) {
			return Zarafa.common.ui.IconClass.getIconClass(record);
		}
	}
});

Ext.reg('zarafa.memberbox', Zarafa.contact.ui.MemberBox);
