Ext.namespace('Zarafa.common.freebusy.ui');

/**
 * @class Zarafa.common.freebusy.ui.UserListView
 * @extends Zarafa.common.recipientfield.ui.RecipientList
 * @xtype zarafa.freebusyuserlistview
 */
Zarafa.common.freebusy.ui.UserListView = Ext.extend(Zarafa.common.recipientfield.ui.RecipientList, {

	/**
	 * @cfg {Zarafa.common.freebusy.data.FreebusyModel} model
	 * The model that keeps track of the userStore, dates, etc.
	 */
	model: null,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			boxType : 'zarafa.userlistbox',
			wrapCls : 'x-form-text x-zarafa-boxfield x-freebusy-userlist-container',
			border: true
		});

		Zarafa.common.freebusy.ui.UserListView.superclass.constructor.call(this, config);

		if (this.model) {
			this.setRecipientStore(this.model.getUserStore());
			this.mon(this.model, 'userstorechange', this.onUserStoreChange, this);
		}
	},

	/**
	 * Event handler which is fired when the {@link #model} fires the
	 * {@link Zarafa.common.freebusy.data.FreebusyModel#userstorechange userstorechange} event. This
	 * will update the {@link #boxStore} with the new userstore.
	 * @param {Zarafa.core.data.RecipientStore} newStore The new userstore
	 * @private
	 */
	onUserStoreChange : function(newStore)
	{
		this.setRecipientStore(newStore);
	},

	/**
	 * Called to filter out records before they are added to this field. Can be overwritten to 
	 * implement such a filter. By default it will allow all records.
	 * @param {Zarafa.core.data.IPMRecipientStore} store RecipientStore
	 * @param {Zarafa.core.data.IPMRecipientRecord[]} records The records to be filtered
	 * @return {Zarafa.core.data.IPMRecipientRecord[]} Filtered records
	 */
	filterRecords : function(store, records)
	{
		var ret = [];

		for (var i = 0, len = records.length; i < len; i++) {
			var record = records[i];

			if (!Ext.isDefined(this.filterRecipientType) || record.get('recipient_type') === this.filterRecipientType) {
				ret.push(record);
			}
		}

		return ret;
	},

	/**
	 * Callback function from {@link Zarafa.common.ui.Box} which indicates that
	 * the box is being removed by the user. This will fire the {@link #boxremove}
	 * event.
	 * @param {Zarafa.common.ui.Box} box The box which called this function
	 */
	doBoxRemove: function(box)
	{
		if (!box.record.isMeetingOrganizer()) {
			Zarafa.common.freebusy.ui.UserListView.superclass.doBoxRemove.apply(this, arguments);
		}
	},

	/**
	 * Event handler when the contextmenu is requested for a Box.
	 * @param {Zarafa.common.recipientfield.ui.RecipientField} field This field to which the box belongs
	 * @param {Zarafa.common.recipientfield.ui.RecipientBox} box The box for which the contextmenu is requested
	 * @param {Zarafa.core.data.IPMRecipientRecord} record The record which is attached to the box
	 * @private
	 */
	onBoxContextMenu : function(field, box, record)
	{
		Zarafa.core.data.UIFactory.openContextMenu(Zarafa.core.data.SharedComponentType['common.contextmenu.freebusy'], record, { position : box.getEl().getXY(), editable : box.editable});
	}
});

Ext.reg('zarafa.freebusyuserlistview', Zarafa.common.freebusy.ui.UserListView);
