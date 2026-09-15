/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.reminder.dialogs');

/**
 * @class Grommunio.common.reminder.dialogs.ReminderContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.remindercontentpanel
 */
Grommunio.common.reminder.dialogs.ReminderContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Grommunio.common.reminder.data.ReminderStore} store store that will be used to get reminder information.
	 */
	store: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.store)) {
			config.store = container.getReminderStore();
		}

		config = Ext.applyIf(config, {
			xtype: 'grommunio.remindercontentpanel',
			layout: 'fit',
			title: _('Reminders'),
			border: false,
			width: 420,
			minWidth: 420,
			maxWidth: 420,
			height: 400,
			useInputAutoFocusPlugin: false,
			forceFullyOpenInMainWindow: true,
			items: [{
				xtype: 'grommunio.reminderpanel',
				store: config.store
			}]
		});

		Grommunio.common.reminder.dialogs.ReminderContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.remindercontentpanel', Grommunio.common.reminder.dialogs.ReminderContentPanel);
