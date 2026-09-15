/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.freebusy.ui');

/**
 * @class Grommunio.common.freebusy.ui.UserListView
 * @extends Grommunio.common.recipientfield.ui.RecipientList
 * @xtype grommunio.freebusyuserlistview
 */
Grommunio.common.freebusy.ui.UserListView = Ext.extend(Grommunio.common.recipientfield.ui.RecipientList, {

	/**
	 * @cfg {Grommunio.common.freebusy.data.FreebusyModel} model
	 * The model that keeps track of the userStore, dates, etc.
	 */
	model: null,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			boxType: 'grommunio.userlistbox',
			wrapCls: 'x-form-text x-grommunio-boxfield x-freebusy-userlist-container',
			border: true
		});

		Grommunio.common.freebusy.ui.UserListView.superclass.constructor.call(this, config);

		if (this.model) {
			this.setRecipientStore(this.model.getUserStore());
			this.mon(this.model, 'userstorechange', this.onUserStoreChange, this);
		}
	},

	/**
	 * Event handler which is fired when the {@link #model} fires the
	 * {@link Grommunio.common.freebusy.data.FreebusyModel#userstorechange userstorechange} event. This
	 * will update the {@link #boxStore} with the new userstore.
	 * @param {Grommunio.core.data.RecipientStore} newStore The new userstore
	 * @private
	 */
	onUserStoreChange: function(newStore)
	{
		this.setRecipientStore(newStore);
	},

	/**
	 * Called to filter out records before they are added to this field. Can be overwritten to
	 * implement such a filter. By default it will allow all records.
	 * @param {Grommunio.core.data.IPMRecipientStore} store RecipientStore
	 * @param {Grommunio.core.data.IPMRecipientRecord[]} records The records to be filtered
	 * @return {Grommunio.core.data.IPMRecipientRecord[]} Filtered records
	 */
	filterRecords: function(store, records)
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
	 * Callback function from {@link Grommunio.common.ui.Box} which indicates that
	 * the box is being removed by the user. This will fire the {@link #boxremove}
	 * event.
	 * @param {Grommunio.common.ui.Box} box The box which called this function
	 */
	doBoxRemove: function(box)
	{
		if (!box.record.isMeetingOrganizer()) {
			Grommunio.common.freebusy.ui.UserListView.superclass.doBoxRemove.apply(this, arguments);
		}
	},

	/**
	 * Event handler when the contextmenu is requested for a Box.
	 * @param {Grommunio.common.recipientfield.ui.RecipientField} field This field to which the box belongs
	 * @param {Grommunio.common.recipientfield.ui.RecipientBox} box The box for which the contextmenu is requested
	 * @param {Grommunio.core.data.IPMRecipientRecord} record The record which is attached to the box
	 * @private
	 */
	onBoxContextMenu: function(field, box, record)
	{
		Grommunio.core.data.UIFactory.openContextMenu(Grommunio.core.data.SharedComponentType['common.contextmenu.freebusy'], record, { position: box.getEl().getXY(), editable: box.editable});
	}
});

Ext.reg('grommunio.freebusyuserlistview', Grommunio.common.freebusy.ui.UserListView);
