Ext.namespace('Zarafa.common.freebusy.ui');

/**
 * @class Zarafa.common.freebusy.ui.UserlistBox
 * @extends Zarafa.common.recipientfield.ui.RecipientBox
 * @xtype zarafa.userlistbox
 *
 * Extension of the {@link Zarafa.common.recipientfield.ui.RecipientBox RecipientBox}
 * which must be used in the {@link Zarafa.common.freebusy.ui.UserlistView} where
 * the users are listed
 */
Zarafa.common.freebusy.ui.UserlistBox = Ext.extend(Zarafa.common.recipientfield.ui.RecipientBox, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			autoHeight : true,
			btnCls : 'x-freebusy-userrow-remove',
			btnHoverCls : 'x-freebusy-userrow-remove-hover'
		});

		Zarafa.common.freebusy.ui.UserlistBox.superclass.constructor.call(this, config);
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
		switch (record.get('recipient_type')) {
			case Zarafa.core.mapi.RecipientType.MAPI_CC:
				return 'icon_meetingrequest_optionalattendee';
			case Zarafa.core.mapi.RecipientType.MAPI_BCC:
				return 'icon_meetingrequest_resource';
			case Zarafa.core.mapi.RecipientType.MAPI_TO:
			/*fall through*/
			default:
				if(record.isMeetingOrganizer()) {
					return 'icon_meetingrequest_organizer';
				}
				return 'icon_meetingrequest_requiredattendee';
		}
	},

	/**
	 * Function called after the {@link #render rendering} of this component.
	 * This will hide the {@link #delBtnEl} when the {@link #editable} flag is false
	 * @param {Ext.Container} ct The container in which the component is being rendered.
	 * @private.
	 */
	afterRender : function(ct)
	{
		Zarafa.common.freebusy.ui.UserlistBox.superclass.afterRender.call(this, ct);
		this.delBtnEl.setVisible(this.editable);
	},

	/**
	 * Update the {@link #textEl inner HTML} of this component using the {@link #textTpl template}.
	 * @param {Ext.data.Record} record The Ext.data.Record which data must be applied to the template
	 */
	update: function(record)
	{
		if (record.isMeetingOrganizer()) {
			this.setEditable(false);
		}

		// className is contains css classes for different type of attendee's icon element.
		var className = ['icon_meetingrequest_requiredattendee',
			'icon_meetingrequest_optionalattendee',
			'icon_meetingrequest_resource'];

		// Clear the css class of attendee's icon element which is defined attendee's type.
		this.iconEl.removeClass(className);

		Zarafa.common.freebusy.ui.UserlistBox.superclass.update.apply(this, arguments);

		// When record gets updated by resolve request, it may be possible that it is a DistList.
		// Resize the expand button only if the recipient is distribution list.
		if(this.record.get('object_type') == Zarafa.core.mapi.ObjectType.MAPI_DISTLIST) {
			if (this.enableButtons === true && Ext.isDefined(this.expandBtnEl)) {
				// Box needs to be resized manually because resizing (and all other post rendering activities)
				// was completed at the time when box gets updated after resolve-response arrived.
				this.onResize(this.width, this.height, this.width, this.height);
			}
		}
	}
});

Ext.reg('zarafa.userlistbox', Zarafa.common.freebusy.ui.UserlistBox);
