/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.CalendarOptionsContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.calendaroptionscontentpanel
 */
Grommunio.calendar.dialogs.CalendarOptionsContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.calendaroptionscontentpanel',
			layout: 'fit',
			title: _('Message Options'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: !config.modal,
			width: 360,
			height: 220,
			items: [{
				xtype: 'grommunio.calendaroptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				}]
			}]
		});

		Grommunio.calendar.dialogs.CalendarOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.calendaroptionscontentpanel', Grommunio.calendar.dialogs.CalendarOptionsContentPanel);
