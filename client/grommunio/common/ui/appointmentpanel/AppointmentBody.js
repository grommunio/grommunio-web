Ext.namespace('Grommunio.common.ui.appointmentpanel');

/**
 * @class Grommunio.common.ui.appointmentpanel.AppointmentBody
 * @extends Ext.form.FormPanel
 * @xtype grommunio.appointmentbody
 */
Grommunio.common.ui.appointmentpanel.AppointmentBody = Ext.extend(Ext.form.FormPanel, {
	/**
	 * @cfg {Ext.Template/String} headerTemplate The template or template string which
	 * must be applied to the {@link #header} when the {@link Grommunio.core.data.IPMRecord record}
	 * has been {@link #update updated}. The arguments of this template will be the
	 * {@link Grommunio.core.data.IPMRecord#data record.data} field.
	 */
	headerTemplate:
		'<div class="preview-header-titlebox">' +
			'<tpl if="!Ext.isEmpty(values.subject)">' +
				'<span class="preview-title">{subject:htmlEncode}</span>' +
			'</tpl>' +
		'</div>',

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		config = Ext.applyIf(config, {
			xtype: 'grommunio.appointmentbody',
			border: false,
			header: true,
			autoScroll: true,
			unstyled: true,
			autoWidth: true,
			headerCfg: {
				cls: 'preview-header-title'
			},
			items: [{
				xtype:'fieldset',
				title: _('Appointment'),
				defaults: {
					xtype: 'displayfield'
				},
				items: [{
					fieldLabel: _('Subject'),
					name: 'subject'
				}, {
					fieldLabel: _('Location'),
					name: 'location'
				}, {
					fieldLabel: _('Label'),
					ref: '../labelPreview'
				}, {
					fieldLabel: _('Start Date'),
					ref: '../startDate'
				}, {
					fieldLabel: _('End Date'),
					ref: '../endDate'
				}, {
					fieldLabel: _('All Day Event'),
					name: 'alldayevent'
				}]
			}]
		});

		Grommunio.common.ui.appointmentpanel.AppointmentBody.superclass.constructor.call(this, config);

		if (Ext.isString(this.headerTemplate)) {
			this.headerTemplate = new Ext.XTemplate(this.headerTemplate, {
				compiled: true
			});
		}
	},

	/**
	 * Updates the container by loading data from the record data into the {@link #template}
	 *
	 * @param {Grommunio.core.data.IPMRecord} record The record to update the header panel with
	 */
	update: function(record)
	{
		this.record = record;

		this.getForm().loadRecord(record);

		if (Ext.isDefined(record)) {
			this.headerTemplate.overwrite(this.header.dom, record.data);
		} else {
			this.header.dom.innerHTML = '';
		}

		this.labelPreview.setValue(Grommunio.core.mapi.AppointmentLabels.getDisplayName(record.get('label')));

		var startDate = record.get('startdate');
		if (Ext.isDate(startDate)) {
			this.startDate.setValue(startDate);
		}

		var dueDate = record.get('duedate');
		if (Ext.isDate(dueDate)) {
			this.endDate.setValue(dueDate);
		}
	}
});

Ext.reg('grommunio.appointmentbody', Grommunio.common.ui.appointmentpanel.AppointmentBody);
