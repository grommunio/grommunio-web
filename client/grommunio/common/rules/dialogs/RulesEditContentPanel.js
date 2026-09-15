/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.rules.dialogs');

/**
 * @class Grommunio.common.rules.dialogs.RulesEditContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.ruleseditcontentpanel
 *
 * {@link Grommunio.common.rules.dialogs.RulesEditContentPanel RulesEditContentPanel} will be used to edit the rules.
 */
Grommunio.common.rules.dialogs.RulesEditContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
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
			xtype: 'grommunio.ruleseditcontentpanel',
			// Override from Ext.Component
			layout: 'fit',
			modal: true,
			cls: 'k-ruleseditpanel',
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true,
				useShadowStore: true
			}),
			autoSave: false,
			width: 760,
			height: 457,
			title: _('Inbox Rule'),
			items: [{
				xtype: 'grommunio.ruleseditpanel',
				storeEntryId: config.record.getStore().storeEntryId,
				buttons: [{
					text: _('Save'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.onCancel,
					scope: this
				}]
			}]
		});

		Grommunio.common.rules.dialogs.RulesEditContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.ruleseditcontentpanel', Grommunio.common.rules.dialogs.RulesEditContentPanel);
