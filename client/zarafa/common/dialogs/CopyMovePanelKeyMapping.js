/*
 * #dependsFile client/zarafa/core/KeyMapMgr.js
 */
Ext.namespace('Zarafa.common.dialogs');

/**
 * @class Zarafa.common.dialogs.KeyMapping
 * @extends Object
 *
 * The map of keys used in the Copy/Move Panel.
 * @singleton
 */
Zarafa.common.dialogs.CopyMovePanelKeyMapping = Ext.extend(Object, {
	/**
	 * @constructor
	 */
	constructor: function()
	{
		var keys = [{
			key: Ext.EventObject.ENTER,
			ctrl: false,
			alt: false,
			shift: false,
			stopEvent: true,
			handler: this.onMoveItems,
			enableGlobally: true,
			scope: this,
			basic: true
		}];

		Zarafa.core.KeyMapMgr.register('Zarafa.common.dialogs.CopyMovePanel', keys);
	},

	/**
	 * Event handler for the keydown event of the {@link Zarafa.core.KeyMap KeyMap} when the user wants to 
	 * move items.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Zarafa.common.dialogs.CopyMovePanel} copyMovePanel The panel on which the key event is fired.
	 */
	onMoveItems: function(key, event, copyMovePanel)
	{
		copyMovePanel.onMove();
	}
});

Zarafa.common.dialogs.CopyMovePanelKeyMapping = new Zarafa.common.dialogs.CopyMovePanelKeyMapping();
