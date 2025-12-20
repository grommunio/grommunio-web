Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.CalendarOptionsContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.calendaroptionscontentpanel
 */
Zarafa.calendar.dialogs.CalendarOptionsContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.calendaroptionscontentpanel',
			layout: 'fit',
			title: _('Message Options'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: config.modal ? false : true,
			width: 360,
			height: 220,
			items: [{
				xtype: 'zarafa.calendaroptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				}]
			}]
		});

		Zarafa.calendar.dialogs.CalendarOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.calendaroptionscontentpanel', Zarafa.calendar.dialogs.CalendarOptionsContentPanel);
