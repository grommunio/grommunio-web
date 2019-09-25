/*
 * #dependsFile client/zarafa/core/KeyMapMgr.js
 */
Ext.namespace('Zarafa.note');

/**
 * @class Zarafa.note.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Note Context.
 * @singleton
 */
Zarafa.note.KeyMapping = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		var newItemKeys = [{
			key: Ext.EventObject.S,
			ctrl: true,
			alt: true,
			shift: false,
			stopEvent: true,
			handler: this.onNewNote,
			scope: this,
			settingsCfg : {
				description : _('New note'),
				category : _('Creating an item')
			}
		}];

		Zarafa.core.KeyMapMgr.register('global', newItemKeys);
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * create a new Sticky Note.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {String} context The name of the context the key is pressed in
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	onNewNote: function(key, event, component)
	{
		Zarafa.note.Actions.openCreateNoteContent(container.getContextByName('note').getModel());
	}

});

Zarafa.note.KeyMapping = new Zarafa.note.KeyMapping();