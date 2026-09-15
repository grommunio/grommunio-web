Ext.namespace('Grommunio.calendar.dialogs');

/**
 * @class Grommunio.calendar.dialogs.CalendarOptionsPanel
 * @extends Ext.Panel
 * @xtype grommunio.calendaroptionspanel
 */
Grommunio.calendar.dialogs.CalendarOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.calendaroptionspanel',
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
				xtype: 'grommunio.recordpropertiespanel',
				flex: 1
			}]
		});

		Grommunio.calendar.dialogs.CalendarOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.calendaroptionspanel', Grommunio.calendar.dialogs.CalendarOptionsPanel);
