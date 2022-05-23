Ext.namespace('Zarafa.calendar.dialogs');

Zarafa.calendar.dialogs.AppointmentPreviewTab = Ext.extend(Ext.form.FormPanel, {

  constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
      xtype: 'panel',
      cls: 'k-body-panel',
      layout: 'fit',
      border: false,
      hidden: false,
      flex: 1,
      autoHeight: false,
      items: [{
        xtype: 'zarafa.messagebody',
        ref: '../bodyPreviewPanel',
        hideLabel: true,
        flex: 1,
        useHtml: true
      }]
    });

		Zarafa.calendar.dialogs.AppointmentTab.superclass.constructor.call(this, config);
	},

});

Ext.reg('zarafa.appointmentpreviewtab', Zarafa.calendar.dialogs.AppointmentPreviewTab);
