/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.recipientfield.ui');

/**
 * @class Grommunio.common.recipientfield.ui.ViewRecipientContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.viewrecipientcontentpanel
 *
 * This content panel allows for simple viewing of a recipient.
 */
Grommunio.common.recipientfield.ui.ViewRecipientContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Grommunio.core.data.IPMRecipientRecord} record The recipient which
	 * is being viewed by this panel.
	 */
	record: undefined,

	/**
	 * The form panel which is loaded inside this panel.
	 * @property
	 * @type Ext.form.FormPanel
	 */
	formPanel: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title: _('View recipient'),
			layout: 'fit',
			width: 350,
			height: 100,
			items: [{
				xtype: 'form',
				layout: 'form',
				border: false,
				bodyStyle: 'padding: 5px; background-color: inherit;',
				ref: 'formPanel',
				items: [{
					xtype: 'textfield',
					fieldLabel: _('Display name'),
					name: 'display_name',
					anchor: '100%',
					readOnly: true
				},{
					xtype: 'textfield',
					fieldLabel: _('Email address'),
					name: 'smtp_address',
					anchor: '100%',
					readOnly: true
				}],
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Grommunio.common.recipientfield.ui.ViewRecipientContentPanel.superclass.constructor.call(this, config);

		this.on('afterlayout', this.onAfterFirstLayout, this, { single: true });
	},

	/**
	 * Event handler which is fired when {@link #afterlayout} has been called for the first time.
	 * This will load the {@link #record} into {@link #formPanel}.
	 * @private
	 */
	onAfterFirstLayout: function()
	{
		this.formPanel.getForm().loadRecord(this.record);
	},

	/**
	 * Event handler which is raised when the user clicks the "Ok" {@link Ext.Button button}
	 * @private
	 */
	onOk: function()
	{
		this.close();
	},

	/**
	 * Event handler which is raised when the user clicks the "Cancel" {@link Ext.Button button}
	 * @private
	 */
	onCancel: function()
	{
		this.close();
	}
});

Ext.reg('grommunio.viewrecipientcontentpanel', Grommunio.common.recipientfield.ui.ViewRecipientContentPanel);
