Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.ui.MemberBoxField
 * @extends Zarafa.common.recipientfield.ui.RecipientField
 * @xtype zarafa.memberboxfield
 *
 * Special {@link Zarafa.common.ui.BoxField boxfield} which is used
 * for displaying Distllist Member records. This works similar to the
 * {@link Zarafa.common.recipientfield.ui.RecipientField} regarding
 * resolving, but it will mark any non-distlist member user as invalid.
 *
 * If the {@link Zarafa.core.plugins.RecordComponentUpdaterPlugin} is installed
 * in the {@link #plugins} array of this component, this component will automatically
 * load the {@link Zarafa.core.data.IPMRecipientStore RecipientStore} into the component.
 * Otherwise the user of this component needs to call {@link #setRecipientStore}.
 */
Zarafa.contact.ui.MemberBoxField = Ext.extend(Zarafa.common.recipientfield.ui.RecipientField, {
	/**
	 * @cfg {Zarafa.core.mapi.RecipientType} defaultRecipientType
	 * @hide
	 */

	/**
	 * @cfg {Zarafa.core.mapi.RecipientType} filterRecipientType
	 * @hide
	 */

	/**
	 * @constructor
	 * @param config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			boxType : 'zarafa.memberbox',
			enableComboBox: false,
			editable: true,
			height: 30
		});

		Ext.apply(config, {
			defaultRecipientType : undefined,
			filterRecipientType : undefined
		});

		Zarafa.contact.ui.MemberBoxField.superclass.constructor.call(this, config);
	},

	/**
	 * Set the store on this field. See {@link #setBoxStore}.
	 * @param {Zarafa.contact.DistlistMemberStore} store The store to set on this field
	 */
	setMemberStore: function(store)
	{
		return this.setBoxStore.apply(this, arguments);
	},

	/**
	 * Get the store attached to this field. See {@link #getBoxStore}.
	 * @return {Zarafa.contact.DistlistMemberStore} store
	 */
	getMemberStore: function()
	{
		return this.getBoxStore();
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		if (record && record instanceof Zarafa.core.data.MAPIRecord) {
			// In case the recordcomponentupdaterplugin is installed
			// we have a special action to update the component.
			if (contentReset && record.isOpened()) {
				this.setMemberStore(record.getMemberStore());
			}
		} else {
			// The recordcomponentupdaterplugin is not installed and the
			// caller really wants to perform the update() function. Probably
			// a bad move, but lets not disappoint the caller.
			Zarafa.contact.ui.MemberBoxField.superclass.update.apply(this, arguments);
		}
	},

	/**
	 * Called by {@link #filterRecords} to check if the given record
	 * must be visible in the field or not. For the recipientfield, we check
	 * the {@link filterRecipientType} property and prevent that the
	 * {@link Zarafa.core.data.IPMRecipientRecord#isMeetingOrganizer meeting organizer}
	 * are visible in the box.
	 * @param {Ext.data.Record} record The record to filter
	 * @return {Boolean} True if the record should be visible, false otherwise
	 * @protected
	 */
	filterRecord : function(record)
	{
		return true;
	},

	/**
	 * Called to handle the input when the user presses the handleInputKey or another trigger makes 
	 * this component need to handle the input. Has to be overwritten to implement the desired 
	 * behavior and the creation of the correct type of record.
	 * @param {String} value The value from the input field
	 */ 
	handleInput : function(value)
	{
		// FIXME: Disallow typing in HTML formatting...
		var splitted = value.split(this.delimiterCharacter);
		var newRecords = [];

		for (var i = 0; i < splitted.length; i++) {
			var str = splitted[i].trim();
			if (!Ext.isEmpty(str)) {
				var record = this.boxStore.parseMember(str);
				newRecords.push(record);
			}
		}

		if(newRecords.length > 0){
			this.boxStore.add(newRecords);
		}
	},

	/**
	 * Event handler when a Box has been double-clicked.
	 * @param {Zarafa.common.recipientfield.ui.RecipientField} field This field to which the box belongs
	 * @param {Zarafa.common.recipientfield.ui.RecipientBox} box The box for which was double-clicked
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record which is attached to the box
	 * @private
	 */
	onBoxDblClick : function(field, box, record)
	{
		if (box.isValidRecord(record)) {
			Zarafa.contact.Actions.openDistlistMember(record);
		}
	},

	/**
	 * Event handler when the contextmenu is requested for a Box.
	 * @param {Zarafa.common.recipientfield.ui.RecipientField} field This field to which the box belongs
	 * @param {Zarafa.common.recipientfield.ui.RecipientBox} box The box for which the contextmenu is requested
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record which is attached to the box
	 * @private
	 */
	onBoxContextMenu : Ext.emptyFn
});

Ext.reg('zarafa.memberboxfield', Zarafa.contact.ui.MemberBoxField);
