/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.dialogs');

/**
 * @class Grommunio.mail.dialogs.ShowMailContentPanel
 * @extends Grommunio.core.ui.MessageContentPanel
 * @xtype grommunio.showmailcontentpanel
 */
Grommunio.mail.dialogs.ShowMailContentPanel = Ext.extend(Grommunio.core.ui.MessageContentPanel, {

	/**
	 * The {@link Grommunio.mail.MailContextModel} which is obtained using {@link #getContextModel}.
	 * @property
	 * @type Grommunio.mail.MailContextModel
	 */
	model: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		// Add in some standard configuration data.
		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.showmailcontentpanel',
			// Override from Ext.Panel
			layout: 'fit',
			title: _('no subject'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			closeOnSend: true,
			items: [ this.createPanel() ]
		});

		// Call parent constructor
		Grommunio.mail.dialogs.ShowMailContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Add the main Window Panel to the content panel. This will contain
	 * a {@link Grommunio.core.ui.ContentPanelToolbar} and a {@link Grommunio.mail.ui.MailViewPanel}.
	 * @return {Object} The configuration object for the panel.
	 * @private
	 */
	createPanel: function()
	{
		// Create a new panel and add it.
		return {
			xtype: 'grommunio.mailviewpanel',
			tbar: {
				xtype: 'grommunio.showmailtoolbar'
			}
		};
	},

	/**
	 * Function gets the {@link Grommunio.mail.MailContextModel MailContextModel} attached to
	 * {@link Grommunio.mail.MailContext MailContext}.
	 * @return {Grommunio.mail.MailContextModel} Mail context model
	 */
	getContextModel: function()
	{
		if(!this.model) {
			var hierarchy = container.getHierarchyStore();
			var parentFolder = this.get('parent_entryid');

			if(!Ext.isEmpty(parentFolder)) {
				parentFolder = hierarchy.getById(parentFolder);
			}

			if(Ext.isEmpty(parentFolder)) {
				parentFolder = hierarchy.getDefaultFolder('drafts');
			}

			// now do round of bidding to find context attached to the folder we got
			var context = container.getContextByFolder(parentFolder);
			this.model = context.getModel();
		}

		return this.model;
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		this.updateIconFromRecord(record);
		this.updateTitleFromRecord(record);
	},

	/**
	 * When record has been updated, title also has to be - for instance if we have the subject
	 * in the title and the subject changes
	 * Calls {@link #setTitle} this.setTitle in order to update
	 * @param {Grommunio.core.data.MAPIRecord} record The record that has been updated
	 */
	updateTitleFromRecord: function(record)
	{
		var subject = record.get('subject');
		if(!Ext.isEmpty(subject)){
			this.setTitle(subject);
		} else {
			this.setTitle(this.initialConfig.title);
		}
	},

	/**
	 * Update this panel's icon class from the record that it contains
	 * First obtains the icon class from a mapping, then calls {@link #setIcon}
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The record bound to this component
	 * @private
	 */
	updateIconFromRecord: function(record)
	{
		//TODO: create a new icon mapping for tabs
		var iconCls = Grommunio.common.ui.IconClass.getIconClass(record);
		this.setIcon(iconCls);
	}
});

Ext.reg('grommunio.showmailcontentpanel', Grommunio.mail.dialogs.ShowMailContentPanel);
