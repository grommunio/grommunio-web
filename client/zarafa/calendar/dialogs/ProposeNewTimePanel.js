/*
 * #dependsFile client/zarafa/core/mapi/ResponseStatus.js
 */
Ext.namespace('Zarafa.calendar.dialogs');

/**
 * @class Zarafa.calendar.dialogs.ProposeNewTimePanel
 * @extends Ext.Panel
 * @xtype zarafa.proposenewtimepanel
 */
Zarafa.calendar.dialogs.ProposeNewTimePanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.core.data.IPMRecord} record The record for which 
	 * propose new time dialog is opened
	 */
	record : undefined,
	/**
	 * @cfg {Zarafa.core.mapi.ResponseStatus} responseType tentative accept/decline
	 * As a default accept tentatively and propose new time.
	 */
	responseType : Zarafa.core.mapi.ResponseStatus.RESPONSE_TENTATIVE,
	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.proposenewtimepanel',
			layout: {
				type: 'vbox',
				align : 'stretch'
			},
			border: false,
			defaults: {
				border: false,
				bodyStyle: 'padding-bottom: 5px; background-color: inherit;'
			},
			items: this.createProposeTimePanel()
		});

		Zarafa.calendar.dialogs.ProposeNewTimePanel.superclass.constructor.call(this, config);

		// set the record values in UI
		this.update(this.record, true);
	},

	/**
	 * Create the {@link Ext.Panel Panel} containing the
	 * {@link Zarafa.common.ui.DateTimePeriodField DateTimePeriodField}.
	 * @return {Object} Configuration object for the panel with time selection fields
	 * @private
	 */
	createProposeTimePanel : function()
	{
		return [{
				xtype: 'zarafa.datetimeperiodfield',
				ref: 'datetimePeriod',
				defaultPeriod: 30,
				width: 300,
				startFieldConfig: {
					name: 'startdate',
					fieldLabel: _('Start time'),
					labelWidth: 100,
					listeners: {
						change: this.onFieldChange,
						scope: this
					}
				},
				endFieldConfig: {
					name: 'duedate',
					fieldLabel: _('End time'),
					labelWidth: 100,
					listeners: {
						change: this.onFieldChange,
						scope: this
					}
				}
			},{
				layout: {
					type: 'hbox',
					pack: 'start',
					align: 'stretch'
				},
				items: [{
						xtype: 'label',
						text: _('Comment') + ': ',
						width: 105
					},{
						xtype: 'textarea',
						ref: '../comment',
						flex:1
					}],
				flex:1
			}];
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		var startDate;
		var dueDate;

		if (record.isMessageClass('IPM.Schedule.Meeting.Request', true)) {
			startDate = record.get('appointment_startdate');
			dueDate = record.get('appointment_duedate');
		} else {
			startDate = record.get('startdate');
			dueDate = record.get('duedate');
		}

		if (startDate && dueDate) {
			this.datetimePeriod.getValue().set(startDate, dueDate);
		}
	},

	/**
	 * Update the {@link Zarafa.core.data.IPMRecord IPMRecord} with the data from the {@link Ext.Panel Panel}.
	 * @param {Zarafa.core.data.IPMRecord} record The record which has to be updated
	 */
	updateRecord : function(record)
	{
		record.proposeNewTimeToMeetingRequest(this.responseType, this.comment.getValue(), this.datetimePeriod.getValue().startDate, this.datetimePeriod.getValue().dueDate);
	}
});

Ext.reg('zarafa.proposenewtimepanel', Zarafa.calendar.dialogs.ProposeNewTimePanel);
