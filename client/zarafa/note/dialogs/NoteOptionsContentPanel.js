Ext.namespace('Zarafa.note.dialogs');

/**
 * @class Zarafa.note.dialogs.NoteOptionsContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.noteoptionscontentpanel
 */
Zarafa.note.dialogs.NoteOptionsContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'zarafa.noteoptionscontentpanel',
			layout: 'fit',
			title: _('Message Options'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: config.modal ? false : true,
			width: 360,
			height: 220,
			items: [{
				xtype: 'zarafa.noteoptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				}]
			}]
		});

		Zarafa.note.dialogs.NoteOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.noteoptionscontentpanel', Zarafa.note.dialogs.NoteOptionsContentPanel);
