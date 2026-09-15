Ext.namespace('Grommunio.note.dialogs');

/**
 * @class Grommunio.note.dialogs.NoteOptionsContentPanel
 * @extends Grommunio.core.ui.RecordContentPanel
 * @xtype grommunio.noteoptionscontentpanel
 */
Grommunio.note.dialogs.NoteOptionsContentPanel = Ext.extend(Grommunio.core.ui.RecordContentPanel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.noteoptionscontentpanel',
			layout: 'fit',
			title: _('Message Options'),
			recordComponentPluginConfig: Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite: true
			}),
			autoSave: !config.modal,
			width: 360,
			height: 220,
			items: [{
				xtype: 'grommunio.noteoptionspanel',
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				}]
			}]
		});

		Grommunio.note.dialogs.NoteOptionsContentPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.noteoptionscontentpanel', Grommunio.note.dialogs.NoteOptionsContentPanel);
