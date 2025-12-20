Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.CalendarOptionsPanel
 * @extends Ext.Panel
 * @xtype zarafa.calendaroptionspanel
 */
Zarafa.calendar.dialogs.CalendarOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.calendaroptionspanel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			defaults: {
				bodyStyle: 'padding-top: 5px; padding-left: 6px; padding-right: 5px; background-color: inherit;',
				border: false
			},
			items: [{
				xtype: 'zarafa.recordpropertiespanel',
				flex: 1
			}]
		});

		Zarafa.calendar.dialogs.CalendarOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.calendaroptionspanel', Zarafa.calendar.dialogs.CalendarOptionsPanel);
