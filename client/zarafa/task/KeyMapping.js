/*
 * #dependsFile client/zarafa/core/KeyMapMgr.js
 */
Ext.namespace('Zarafa.task');

/**
 * @class Zarafa.task.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Task Context.
 * @singleton
 */
Zarafa.task.KeyMapping = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		var newItemKeys = [{
			key: Ext.EventObject.K,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewTask,
			scope: this,
			settingsCfg : {
				description : _('New task'),
				category : _('Creating an item')
			}
		}];

		Zarafa.core.KeyMapMgr.register('global', newItemKeys);
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * create a new task.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewTask: function(key, event, component)
	{
		Zarafa.task.Actions.openCreateTaskContent(container.getContextByName('task').getModel());
	}

});

Zarafa.task.KeyMapping = new Zarafa.task.KeyMapping();