/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.task.dialogs');

/**
 * @class Grommunio.task.dialogs.TaskOptionsContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.taskoptionscontentpanel
 */
Grommunio.task.dialogs.TaskOptionsContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.taskoptionscontentpanel',
			layout: 'fit',
			title: _('Message Options'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: !config.modal,
			width: 360,
			height: 220,
			items: [{
				xtype: 'grommunio.taskoptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				}]
			}]
		});

		Grommunio.task.dialogs.TaskOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.taskoptionscontentpanel', Grommunio.task.dialogs.TaskOptionsContentPanel);
