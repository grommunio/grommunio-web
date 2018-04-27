/*
 * #dependsFile client/zarafa/core/KeyMapMgr.js
 */
Ext.namespace('Zarafa.mail');

/**
 * @class Zarafa.mail.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Mail Context.
 * @singleton
 */
Zarafa.mail.KeyMapping = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		var newMailKeys = [{
			key: Ext.EventObject.X,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewMail,
			scope: this,
			settingsCfg : {
				description : _('New mail'),
				category : _('Creating an item')
			}
		}];

		var itemActionKeys = [{
			key: Ext.EventObject.R,
			ctrl: true,
			alt: false,
			shift: false,
			// Overwrites the browser behavior to reload the browser
			stopEvent: true,
			handler: this.onReplyMail,
			scope: this,
			settingsCfg : {
				description : _('Reply'),
				category : _('Mail')
			}
		},{
			key: Ext.EventObject.R,
			ctrl: true,
			alt: true,
			shift: false,
			// Overwrites the browser behavior to reload the browser
			stopEvent: true,
			handler: this.onReplyAllMail,
			scope: this,
			settingsCfg : {
				description : _('Reply all'),
				category : _('Mail')
			}
		},{
			key: Ext.EventObject.F,
			ctrl: true,
			alt: false,
			shift: false,
			stopEvent: true,
			handler: this.onForwardMail,
			scope: this,
			settingsCfg : {
				description : _('Forward'),
				category : _('Mail')
			}
		},{
			key: Ext.EventObject.E,
			ctrl: true,
			alt: false,
			shift: false,
			stopEvent: true,
			handler: this.onEditAsNewMail,
			scope: this,
			settingsCfg : {
				description : _('Edit as New'),
				category : _('Mail')
			}
		}];

		var mailGridKeys = [{
			key: Ext.EventObject.U,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onReadUnreadToggle,
			scope: this,
			settingsCfg : {
				description : _('Toggle read/unread'),
				category : _('Mail')
			}
		},{
			key: Ext.EventObject.G,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onFlagToggle,
			scope: this,
			settingsCfg : {
				description : _('Toggle red/complete flag'),
				category : _('Mail')
			}
		}];

		Zarafa.core.KeyMapMgr.register('global', newMailKeys);

		// These keys might need to be in mail-global handler
		Zarafa.core.KeyMapMgr.register('grid.mapimessage.mail', mailGridKeys);

		// Reply/Reply All/Forward/Edit as New Key handlers
		Zarafa.core.KeyMapMgr.register('grid.mapimessage.mail', itemActionKeys);
		Zarafa.core.KeyMapMgr.register('previewpanel.mail', itemActionKeys);
		Zarafa.core.KeyMapMgr.register('contentpanel.record.message.showmail', itemActionKeys);
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * create a new item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewMail: function(key, event, component)
	{
		Zarafa.mail.Actions.openCreateMailContent(container.getContextByName('mail').getModel());
	},

	/**
	 * Helper function to get selected record from component.
	 * @param {Ext.Component} component The component on which key event is fired.
	 * @return {Ext.data.Record} The record which is selected int the view.
	 * @private
	 */
	getSelectedRecord : function (component)
	{
		if(Ext.isDefined(component.record)) {
			return component.record;
		} else if(Ext.isFunction(component.getSelectionModel)) {
			return component.getSelectionModel().getSelected();
		}

		return false;
	},

	/**
	 * Helper function to get model of component.
	 * @param {Ext.Component} component The component on which key event is fired.
	 * @return {Zarafa.core.ContextModel} The model of component..
	 * @private
	 */
	getModel : function (component)
	{
		if(Ext.isFunction(component.getContextModel)) {
			return component.getContextModel();
		} else if(Ext.isDefined(component.model)) {
			return component.model;
		}

		return false;
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * reply to an item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onReplyMail: function(key, event, component)
	{
		var record = this.getSelectedRecord(component);
		var model = this.getModel(component);
		if(record){
			Zarafa.mail.Actions.openCreateMailResponseContent(record, model, Zarafa.mail.data.ActionTypes.REPLY);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * reply to all recipients of an item
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onReplyAllMail: function(key, event, component)
	{
		var record = this.getSelectedRecord(component);
		var model = this.getModel(component);
		if(record){
			Zarafa.mail.Actions.openCreateMailResponseContent(record, model, Zarafa.mail.data.ActionTypes.REPLYALL);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * forward an item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onForwardMail: function(key, event, component)
	{
		var record = this.getSelectedRecord(component);
		var model = this.getModel(component);
		if(record){
			Zarafa.mail.Actions.openCreateMailResponseContent(record, model, Zarafa.mail.data.ActionTypes.FORWARD);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * edit a sent item as a new item.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onEditAsNewMail: function(key, event, component)
	{
		var record = this.getSelectedRecord(component);
		var model = this.getModel(component);
		if(record){
			Zarafa.mail.Actions.openCreateMailResponseContent(record, model, Zarafa.mail.data.ActionTypes.EDIT_AS_NEW);
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * mark an item as unread/read.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onReadUnreadToggle: function(key, event, component)
	{
		var records = component.model.getSelectedRecords();
		if(!Ext.isEmpty(records)) {
			if (records[0].isRead()){
				Zarafa.common.Actions.markAsRead(records, false);
			} else {
				Zarafa.common.Actions.markAsRead(records, true);
			}
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * flag an item as complete.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onFlagToggle: function(key, event, component)
	{
		var records = component.model.getSelectedRecords();
		if(!Ext.isEmpty(records)) {
			var currentFlagStatus = records[0].get('flag_status');
			// Event is fired on grid for selected records so assuming that all records
			// are from same store, as they are in same grid.
			var store = records[0].getStore();

			for(var i = 0, len = records.length; i < len; i++){
				var record = records[i];

				// If a record isn't an email, ignore setting the flag
				if(record.isFaultyMessage() || !record.isMessageClass(['IPM.Note', 'IPM.Schedule.Meeting', 'REPORT.IPM', 'REPORT.IPM.Note'], true)) {
					// can not set flag for faulty record
					continue;
				}

				if (currentFlagStatus == Zarafa.core.mapi.FlagStatus.cleared) {
					record.set('flag_status', Zarafa.core.mapi.FlagStatus.flagged);
					record.set('flag_icon', Zarafa.core.mapi.FlagIcon.red);
				} else if (currentFlagStatus == Zarafa.core.mapi.FlagStatus.completed) {
					record.set('flag_status', Zarafa.core.mapi.FlagStatus.flagged);
					record.set('flag_icon', Zarafa.core.mapi.FlagIcon.red);
				} else {
					record.set('flag_status', Zarafa.core.mapi.FlagStatus.completed);
					record.set('flag_icon', Zarafa.core.mapi.FlagIcon.clear);
				}
			}

			// Save all modified records.
			if(store) {
				store.save(records);
			}
		}
	}

});

Zarafa.mail.KeyMapping = new Zarafa.mail.KeyMapping();
