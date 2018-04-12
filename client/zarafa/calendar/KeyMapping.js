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

		var mapiMessageKeys = [{
			key: Ext.EventObject.C,
			ctrl:true,
			alt: false,
			shift: false,
			stopEvent: true,
			enableGlobally : true,
			settingsCfg : {
				description : _('Copy selected item'),
				category : _('Calendar')
			},
			handler:this.onCopyItem,
			scope: this,
			basic: true
		},{
			key: Ext.EventObject.V,
			ctrl:true,
			alt: false,
			shift: false,
			stopEvent: true,
			enableGlobally : true,
			settingsCfg : {
				description : _('Paste selected item'),
				category : _('Calendar')
			},
			handler:this.onPaste,
			scope: this,
			basic: true
		}];

		Zarafa.core.KeyMapMgr.register('global', newItemKeys);
		Zarafa.core.KeyMapMgr.register('view.mapimessage', mapiMessageKeys);
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
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to
	 * copy selected appointment/meeting in calender.
	 *
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onCopyItem : function (key, event, component)
	{
		var records = Zarafa.common.KeyMapping.getSelectedRecords(component);
		if (!Ext.isEmpty(records)) {
			component.clipBoardData = records[0].copy();
			component.isClipBoardDataRecurring = !Ext.isEmpty(records[0].get('basedate'));
		}
	},

	/**
	 * Function which is used to open the selected calender item.
	 *
	 * @param {Ext.Component} component The component on which key event is fired.
	 * @param {Zarafa.core.data.IPMRecord} record A selected calender item in calender view.
	 * @private
	 */
	openRecord : function (component, record)
	{
		var store = container.getShadowStore();
		store.add(record);

		const openHandler = function(store, records)
		{
			// Remove the record from shadowStore and deregister 'open' event.
			store.remove(records, true);
			store.un('open', openHandler, this);
			component.doPaste(records);
		};
		store.on('open', openHandler, this);
		record.open();
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to
	 * paste the copied appointment/meeting in calender.
	 *
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 * @private
	 */
	onPaste : function (key, event, component)
	{
		if(Ext.isEmpty(component.clipBoardData)) {
			return;
		}
		var record = component.clipBoardData.copy();
		if (component.isClipBoardDataRecurring) {
			var config = {
				component : component,
				scope : this
			};
			Zarafa.calendar.Actions.copyRecurringItemContent(record, config);
		} else if(!record.isOpened()) {
			this.openRecord(component, record);
		} else {
			component.doPaste(record);
		}
	}
});

Zarafa.calendar.KeyMapping = new Zarafa.calendar.KeyMapping();
