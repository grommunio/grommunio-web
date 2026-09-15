Ext.namespace('Grommunio.calendar.ui');

/**
 * @class Grommunio.calendar.ui.AppointmentPreviewPanel
 * @extends Ext.Panel
 * @xtype grommunio.appointmentpreviewpanel
 *
 * Panel that previews the contents of appointment.
 */
Grommunio.calendar.ui.AppointmentPreviewPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.appointmentpreviewpanel',
			border: false,
			bodyCfg: {
				cls: 'preview-body'
			},
			layout: 'fit',
			items: [{
				xtype: 'grommunio.appointmentbody'
			}]
		});

		Grommunio.calendar.ui.AppointmentPreviewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('grommunio.appointmentpreviewpanel', Grommunio.calendar.ui.AppointmentPreviewPanel);
