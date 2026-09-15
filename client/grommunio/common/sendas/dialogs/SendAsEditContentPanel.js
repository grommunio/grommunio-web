/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.sendas.dialogs');

/**
 * @class Grommunio.common.sendas.dialogs.SendAsEditContentPanel
 * @extends Grommunio.common.recipientfield.ui.EditRecipientContentPanel
 * @xtype grommunio.sendaseditcontentpanel
 *
 * {@link Grommunio.common.sendas.dialogs.SendAsEditContentPanel SendAsEditContentPanel} will be used to edit sendas addresses.
 */
Grommunio.common.sendas.dialogs.SendAsEditContentPanel = Ext.extend(Grommunio.common.recipientfield.ui.EditRecipientContentPanel, {
	/**
	 * @cfg {Boolean} removeOnCancel Remove the {@link Grommunio.core.data.IPMRecipientRecord record} from store
	 * while user press "cancel" button.
	 */
	removeOnCancel: true,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.sendaseditcontentpanel',
			title: _('Add/Edit sender')
		});

		Grommunio.common.sendas.dialogs.SendAsEditContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk: function()
	{
		var editForm = this.formPanel.getForm();
		var record = this.record;

		if (!editForm.isValid()) {
			return;
		}

		editForm.updateRecord(record);

		if (record.dirty === false) {
			this.close();
			return;
		}

		if (record.store.isRecipientExists(record)) {
			record.reject();
			Ext.Msg.alert(_('Duplicate recipient'), _('Recipient already exists.'));
			return;
		}

		record.generateOneOffEntryId();
		this.close();
	},

	/**
	 * Function will be called when user clicks on close tool on the {@link Ext.Window}
	 * and should remove phantom record if needed.
	 * @protected
	 */
	closeWrap: function()
	{
		this.removePhantomRecord();
		Grommunio.common.sendas.dialogs.SendAsEditContentPanel.superclass.closeWrap.apply(this, arguments);
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 * @private
	 */
	onCancel: function()
	{
		this.removePhantomRecord();
		Grommunio.common.sendas.dialogs.SendAsEditContentPanel.superclass.onCancel.call(this);
	},

	/**
	 * Function is used to remove {@link Grommunio.core.data.IPMRecipientRecord SendAsRecipient}
	 * from {Grommunio.core.data.IPMRecipientStore} when {@link #removeOnCancel}
	 * is true and user has closed the dialog without saving it.
	 * @private
	 */
	removePhantomRecord: function()
	{
		if (this.removeOnCancel === true && this.record.phantom) {
			this.record.store.remove(this.record);
		}
	}
});

Ext.reg('grommunio.sendaseditcontentpanel', Grommunio.common.sendas.dialogs.SendAsEditContentPanel);
