Ext.namespace('Zarafa.note.dialogs');

/**
 * @class Zarafa.note.dialogs.NoteOptionsPanel
 * @extends Ext.Panel
 * @xtype zarafa.noteoptionspanel
 */
Zarafa.note.dialogs.NoteOptionsPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.noteoptionspanel',
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

		Zarafa.note.dialogs.NoteOptionsPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.noteoptionspanel', Zarafa.note.dialogs.NoteOptionsPanel);
