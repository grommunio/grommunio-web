Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.AppointmentPreviewPanel
 * @extends Ext.Panel
 * @xtype zarafa.appointmentpreviewpanel
 * 
 * Panel that previews the contents of appointment.
 */
Zarafa.calendar.ui.AppointmentPreviewPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.appointmentpreviewpanel',
			border : false,
			bodyCfg: {
				cls : 'preview-body'
			},
			layout : 'fit',
			items : [{
				xtype: 'zarafa.appointmentbody'
			}]
		});

		Zarafa.calendar.ui.AppointmentPreviewPanel.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.appointmentpreviewpanel', Zarafa.calendar.ui.AppointmentPreviewPanel);
