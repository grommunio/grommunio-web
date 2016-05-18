/*
 * #dependsFile client/zarafa/core/KeyMapMgr.js
 */
Ext.namespace('Zarafa.calendar');

/**
 * @class Zarafa.calendar.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Calendar Context.
 * @singleton
 */
Zarafa.calendar.KeyMapping = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		var newItemKeys = [{
			key: Ext.EventObject.A,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewAppointment,
			scope: this,
			settingsCfg : {
				description : _('New appointment'),
				category : _('Creating an item')
			}
		},{
			key: Ext.EventObject.V,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewMeetingRequest,
			scope: this,
			settingsCfg : {
				description : _('New meeting request'),
				category : _('Creating an item')
			}
		},{
			key: [Ext.EventObject.LEFT, Ext.EventObject.RIGHT],
			ctrl: false,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onSwitchRange,
			scope: this,
			settingsCfg : {
				description : _('Switch calendar range back and forth'),
				category : _('Calendar')
			}
		}];

		Zarafa.core.KeyMapMgr.register('global', newItemKeys);
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * create a new appointment.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewAppointment: function(key, event, component)
	{
		Zarafa.calendar.Actions.openCreateAppointmentContent(container.getContextByName('calendar').getModel());
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * create a new meeting request.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewMeetingRequest: function(key, event, component)
	{
		Zarafa.calendar.Actions.openCreateMeetingRequestContent(container.getContextByName('calendar').getModel());
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants
	 * switch between {@link Zarafa.core.ui.MainContentTabPanel MainContentTabs} calendar ranges.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onSwitchRange: function(key, event, component)
	{
		if(key === Ext.EventObject.LEFT){
			container.getContextByName('calendar').getModel().previousDate();
		} else {
			container.getContextByName('calendar').getModel().nextDate();
		}
	}

});

Zarafa.calendar.KeyMapping = new Zarafa.calendar.KeyMapping();
