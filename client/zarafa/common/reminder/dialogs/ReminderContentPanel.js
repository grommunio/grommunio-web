Ext.namespace('Zarafa.common.reminder.dialogs');

/**
 * @class Zarafa.common.reminder.dialogs.ReminderContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.remindercontentpanel
 */
Zarafa.common.reminder.dialogs.ReminderContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Zarafa.common.reminder.data.ReminderStore} store store that will be used to get reminder information.
	 */
	store : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.store)) {
			config.store = container.getReminderStore();
		}

		config = Ext.applyIf(config, {
			xtype : 'zarafa.remindercontentpanel',
			layout: 'fit',
			title : _('Reminders'),
			border: false,
			width: 350,
			minWidth: 350,
			maxWidth: 350,
			height: 300,
			forceFullyOpenInMainWindow: true,
			items : [{
				xtype : 'zarafa.reminderpanel',
				store: config.store
			}]
		});

		Zarafa.common.reminder.dialogs.ReminderContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.remindercontentpanel', Zarafa.common.reminder.dialogs.ReminderContentPanel);
