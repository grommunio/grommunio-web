Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.MeetingInfo
 * @extends Ext.Container
 * @xtype zarafa.meetinginfo
 * This will display start/end date and location of the appointment in the header.
 */
Zarafa.calendar.ui.MeetingInfo = Ext.extend(Ext.Container, {
	/**
	 * The record which has been loaded by this container. This record
	 * is provided through the {@link #update} function.
	 *
	 * @property
	 * @type Zarafa.core.data.IPMRecord
	 */
	record : undefined,

	/**
	 * @cfg {Ext.Template/String} meetingInfoTemplate The template which must be applied 
	 * {@link #header} to build meeting info when the {@link Zarafa.core.data.IPMRecord record} 
	 * has been {@link #update updated}.The arguments of this template will be 
	 * the {@link Zarafa.core.data.IPMRecord#data record.data} field.
	 */
	meetingInfoTemplate :
			'<hr class="preview-title-hr">'+
			 '<table>'+
					'<tpl if="values.counter_proposal">' +
						'<tr class="preview-proposed">' + 
	/* # TRANSLATORS: This message is used as label for the field which to indicates to whom the given mail was sent. */
							'<td class="preview-proposed-title">' + pgettext('mail.previewpanel', 'Proposed') + ':</td>'+
							'<td>'+
								'<tpl if="!Ext.isEmpty(values.proposed_start_date)">' +
									// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
									'{proposed_start_date:date(_("l jS F Y G:i"))}' +
									'<span>&nbsp;-&nbsp;</span>' +
								'</tpl>'+
								'<tpl if="!Ext.isEmpty(values.proposed_end_date)">' +
									// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
									'{proposed_end_date:date(_("l jS F Y G:i"))}' +
								'</tpl>'+
							'</td>'+
						'</tr>'+
					'</tpl>'+
							
					'<tr class="preview-when">' +
					/* # TRANSLATORS: This message is used as label for the field which to indicates to whom the given mail was sent */
						'<td class="preview-when-title">' + pgettext('mail.previewpanel', 'When') + ':</td>' +
						'<td>'+
							'<tpl if="values.appointment_recurring === true">' +
								'{appointment_recurring_pattern}' +
							'</tpl>' +
							'<tpl if="values.appointment_recurring !== true">' +
								'<tpl if="!Ext.isEmpty(values.appointment_startdate)">' +
									// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
									'{appointment_startdate:date(_("l jS F Y G:i"))}' +
									'<span>&nbsp;-&nbsp;</span>' +
								'</tpl>' +
								'<tpl if="!Ext.isEmpty(values.appointment_duedate)">' +
									// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
									'{appointment_duedate:date(_("l jS F Y G:i"))}' +
								'</tpl>' +
							'</tpl>' +
						'</td>'+
					'</tr>'+
				
					'<tpl if="!Ext.isEmpty(values.appointment_location)">' +
							'<tr class="preview-location">' +
							/* # TRANSLATORS: This message is used as label for the field which to indicates to whom the given mail was sent */
								'<td class="preview-location-title">' + pgettext('mail.previewpanel', 'Location') + ':</td>' +
								'<td>'+
									'{appointment_location:htmlEncode}' + 
								'</td>'+
							'</tr>'+
					'</tpl>'+
				'</table>',
				

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('zarafa.recordcomponentupdaterplugin');
		
		config =  Ext.applyIf(config, {
			xtype: 'zarafa.meetinginfo',
			cls: 'preview-header-meeting',
			hidden : true,
			forceLayout : true
		});
		
		Zarafa.calendar.ui.MeetingInfo.superclass.constructor.call(this, config);

		if (Ext.isString(this.meetingInfoTemplate)) {
			this.meetingInfoTemplate = new Ext.XTemplate(this.meetingInfoTemplate, {
				compiled: true
			});
		}
	},

	/**
	 * Update the {@link Zarafa.calendar.ui.MeetingInfo header} with the data
	 * from the {@link Zarafa.core.data.IPMRecord record}. Updates the panel
	 * by loading data from the record data into the template.
	 * 	
	 * @param {Zarafa.core.data.IPMRecord} record to update the header panel with
	 */
	update: function(record)
	{
		if (record instanceof Zarafa.calendar.MeetingRequestRecord) {
			this.meetingInfoTemplate.overwrite(Ext.get(this.el.dom), record.data);
			this.setVisible(true);
		} else {
			this.el.dom.innerHTML = '';
			this.setVisible(false);
		}
	}
});

Ext.reg('zarafa.meetinginfo', Zarafa.calendar.ui.MeetingInfo);
