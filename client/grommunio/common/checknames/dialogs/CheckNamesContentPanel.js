/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.checknames.dialogs');

/**
 * @class Grommunio.common.checknames.dialogs.CheckNamesContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.checknamescontentpanel
 */
Grommunio.common.checknames.dialogs.CheckNamesContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Array} array store
	 * array store of checknames, that will be populated in ListBox
	 */
	checkNamesData: undefined,

	/**
	 * @cfg {Grommunio.core.data.IPMRecipientRecord} record
	 * recipient record for which the content panel is to be created
	 */
	record: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};
		config = Ext.applyIf(config, {
			xtype: 'grommunio.checknamescontentpanel',
			layout: 'fit',
			title: _('Check Names'),
			border: false,
			width: 320,
			height: 300,
			items:[{
				xtype	: 'grommunio.checknamespanel',
				buttons: [{
					text	: _('Ok'),
					tabIndex: 0,
					handler	: this.onOk,
					scope	: this
					},{
					text	: _('Cancel'),
					tabIndex: 0,
					handler	: this.onCancel,
					scope	: this
				}]
			}]
		});

		Grommunio.common.checknames.dialogs.CheckNamesContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Called automatically when the contentpanel is being rendered. This
	 * will load the {@link #record} and {@link #checknamesData} into
	 * the {@link Grommunio.common.checknames.dialogs.CheckNamesPanel CheckNamesPanel}.
	 * @private
	 */
	onRender: function()
	{
		Grommunio.common.checknames.dialogs.CheckNamesContentPanel.superclass.onRender.apply(this, arguments);

		this.get(0).update(this.record, this.checkNamesData);

		// Add focus trapping for Tab navigation
		this.getEl().on('keydown', function(e) {
			if (e.getKey() === Ext.EventObject.TAB) {
				const focusableElements = this.getEl().query('button, [tabindex]:not([tabindex="-1"])');
				const firstElement = focusableElements[0];
				const lastElement = focusableElements[focusableElements.length - 1];

				if (e.shiftKey && e.target === firstElement) {
					e.stopEvent();
					lastElement.focus();
				} else if (!e.shiftKey && e.target === lastElement) {
					e.stopEvent();
					firstElement.focus();
				}
			}
		}, this);

	},

	/**
	 * event handler for Ok button click for checkNames content panel
	 * this will set the selected display name to recipient record
	 * @param {Grommunio.core.data.IPMRecipientRecord} recipientrecord
	 * @private
	 */
	onOk: function()
	{
		if (this.get(0).updateRecord(this.record) !== false) {
			this.dialog.close();
		}
	},

	/**
	 * event handler for Cancel button click for checkNames content panel
	 * this will close the checkNames content panel
	 * @private
	 */
	onCancel: function()
	{
		this.markRecipientToInvalid();
		this.dialog.close();
	},

	/**
	 * Function used to mark the recipient to invalid.
	 */
	markRecipientToInvalid: function()
	{
		this.record.resolveAttemptAmbiguous = false;
		this.record.resolveAttempted = true;
		this.record.afterEdit();
	},

	/**
	 * Function has been called when check name dialog closed by close button.
	 * It will call {@link #markRecipientToInvalid} to mark the recipient to invalid.
	 * @override
	 */
	close: function()
	{
		this.markRecipientToInvalid();
		Grommunio.common.checknames.dialogs.CheckNamesContentPanel.superclass.close.apply(this, arguments);
	}
});

Ext.reg('grommunio.checknamescontentpanel', Grommunio.common.checknames.dialogs.CheckNamesContentPanel);
