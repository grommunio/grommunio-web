Ext.namespace('Zarafa.common.recurrence.dialogs');

/**
 * @class Zarafa.common.recurrence.dialogs.RecurrenceContentPanel
 * @extends Zarafa.core.ui.RecordContentPanel
 * @xtype zarafa.recurrencecontentpanel
 */
Zarafa.common.recurrence.dialogs.RecurrenceContentPanel = Ext.extend(Zarafa.core.ui.RecordContentPanel, {
	/**
	 * True when an existing recurrence is being edited by this content panel. When this is true,
	 * {@link #onOk} will request a confirmation if the existing exceptions can be deleted.
	 * @property
	 * @type Boolean
	 * @private
	 */
	editRecurrence : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		// Add in some standard configuration data.
		config = config || {};

		config = Ext.applyIf(config, {
			// Override from Ext.Component
			xtype : 'zarafa.recurrencecontentpanel',
			// Override from Ext.Component
			layout : 'fit',
			title : _('Appointment Recurrence'),
			recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
				allowWrite : true
			}),
			border: false,
			defaults: {
				bodyStyle: 'padding-top: 5px; padding-left: 6px; padding-right: 5px; background-color: inherit;',
				border: false
			},
			autoSave : false,
			width: 600,
			height: 500,
			items: [{
				xtype: 'zarafa.recurrencepanel',
				ref: 'recurrencePanel',
				buttons : [{
					text : _('Ok'),
					handler : this.onOk,
					scope : this,
					ref : '../../okBtn'
				},{
					text : _('Cancel'),
					scope : this,
					handler : this.onCancel
				},{
					text : _('Remove Recurrence'),
					handler : this.onRemoveRecurrence,
					scope: this,
					ref : '../../removeReccurrenceBtn'
				}]
			}]
		});

		// Call parent constructor
		Zarafa.common.recurrence.dialogs.RecurrenceContentPanel.superclass.constructor.call(this, config);

		this.on('beforesetrecord', this.onBeforeSetRecord, this);
		this.on('saverecord', this.onSaveRecord, this);
	},

	/**
	 * When the record is about to be set on the {@link Zarafa.core.ui.RecordContentPanel RecordContentPanel}
	 * we must enable recurrence in the record. By default, opening the RecurrenceContentPanel implies
	 * enabled it.
	 *
	 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The content panel to which the record was set.
	 * @param {Zarafa.core.data.IPMRecord} record The record which must be used for initialization.
	 * @param {Zarafa.core.data.IPMRecord} oldrecord The oldrecord which was previously set
	 * @private
	 */
	onBeforeSetRecord : function(contentpanel, record, oldrecord)
	{
		if (!record.get('recurring')) {
			var startDate = record.get('startdate') || new Date();
			var dueDate = record.get('duedate');
			var startOcc;
			var endOcc;

			if (!Ext.isDate(dueDate)) {
				if (record.get('alldayevent')) {
					dueDate = startDate.add(Date.DAY, 1);
				} else {
					dueDate = startDate.add(Date.MINUTE, 30);
				}
			}

			// Small workaround for allday appointments, in Brasil the DST occurs at 00:00,
			// which means for allday events, that we might think the appointment should start
			// at 01:00, but that might be because that is the start of the actual day. Hence
			// we need to correct the startOcc here for that.
			if (record.get('alldayevent')) {
				var offset = 0;

				startOcc = (startDate.getHours() * 60) + startDate.getMinutes();
				if (startDate.clearTime(true).getTime() === startDate.getTime()) {
					offset = startOcc;
					startOcc = 0;
				}

				endOcc = startOcc + offset + Date.diff(Date.MINUTE, dueDate, startDate);
			} else {
				startOcc = (startDate.getHours() * 60) + startDate.getMinutes();
				endOcc = startOcc + Date.diff(Date.MINUTE, dueDate, startDate);
			}

			record.beginEdit();
			record.set('recurring', true);
			record.set('recurrence_type', Zarafa.common.recurrence.data.RecurrenceType.WEEKLY);
			record.set('recurrence_subtype', Zarafa.common.recurrence.data.RecurrenceSubtype.WEEKLY.type);
			record.set('recurrence_regen', Zarafa.common.recurrence.data.RecurrenceSubtype.WEEKLY.regen);
			record.set('recurrence_term', Zarafa.common.recurrence.data.RecurrenceEnd.NEVER);
			record.set('recurrence_start', startDate.clearTime(true).fromUTC());
			record.set('recurrence_startocc', startOcc);
			record.set('recurrence_endocc', endOcc);
			record.set('recurrence_everyn', 1);
			record.set('recurrence_weekdays', Math.pow(2, startDate.getDay()));
			record.endEdit();

			// We have applied a new recurrence to the record
			this.editRecurrence = false;
		} else {
			// We are editing an existing recurrence on the record
			this.editRecurrence = true;
		}
	},

	/**
	 * Action handler when the user presses the "Ok" button. Overridden from the superclass,
	 * in order to display a warning message that changing the recurrence will discard all
	 * previously created exceptions.
	 * This will call {@link #saveRecord} with the {@link #autoSave} argument.
	 */
	onOk : function()
	{
		// When this was already an existing recurring series, then we must warn the user that all previously
		// created exceptions will be discarded. When this is a new series, then we can directly start
		// creating the new recurrence.
		if (this.record.phantom !== true && this.editRecurrence === true && this.record.hasRecurringExceptions()) {
			Ext.MessageBox.confirm(
				_('Kopano WebApp'),
				_('This will discard any exceptions which might have been made for this recurring series. Do you wish to continue?'),
				function(button) {
					if (button === 'yes') {
						Zarafa.common.recurrence.dialogs.RecurrenceContentPanel.superclass.onOk.apply(this, arguments);
					}
				},
				this
			);
		} else {
			Zarafa.common.recurrence.dialogs.RecurrenceContentPanel.superclass.onOk.apply(this, arguments);
		}
	},

	/**
	 * When the record is about to be saved on the {@link Zarafa.core.ui.RecordContentPanel RecordContentPanel}
	 * we must update the recurrence description, based on all the properties which have been filled in
	 * from the {@link Zarafa.common.recurrence.dialogs.RecurrencePanel RecurrencePanel}.
	 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The contentpanel which invoked the event
	 * @param {Zarafa.core.data.IPMRecord} record The record which is being saved.
	 * @private
	 */
	onSaveRecord : function(contentpanel, record)
	{
		// Recurrence has been changed, inform the server
		// to reset the recurrence.
		record.set('recurring_reset', true);

		// This is not a recurring message, clear the recurring pattern
		if (!record.get('recurring')) {
			record.set('recurring_pattern', '');
			return;
		}

		// When applying a recurrence, update the timezone information
		// to ensure that the PHP can convert everything correctly.
		record.updateTimezoneInformation();

		// generate recurring pattern and save in the record
		record.set('recurring_pattern', record.generateRecurringPattern());
	},

	/**
	 * Update the {@link Ext.Panel Panel} with the given {@link Zarafa.core.data.IPMRecord IPMRecord}
	 * @param {Zarafa.core.data.IPMRecord} record The record to update the panel with
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update : function(record, contentReset)
	{
		this.updateTitleFromRecord(record);

		// disable ok and remove recurrence buttons for sub messages
		var disabled = false;
		if(record && record.isSubMessage()) {
			disabled = true;
		}

		this.removeReccurrenceBtn.setDisabled(disabled);
		this.okBtn.setDisabled(disabled);
	},

	/**
	 * When record has been updated, title also has to be - for instance if we have the subject
	 * in the title and the subject changes
	 * Calls {@link #setTitle} this.setTitle in order to update
	 * @param {Zarafa.core.data.MAPIRecord} record The record that has been updated
	 */
	updateTitleFromRecord : function(record)
	{
		if (!Ext.isDefined(record)) {
			this.setTitle(this.initialConfig.title);
		} else if (record.isMessageClass('IPM.TaskRequest', true)) {
			this.setTitle(_('Task Recurrence'));
		} else {
			this.setTitle(_('Appointment Recurrence'));
		}
	},

	/**
	 * Override the onSetRecord function from {@link Zarafa.core.ui.RecordContentPanel RecordContentPanel}
	 * to set the title to the correct value depending on the Message Class.
	 * @param {Zarafa.core.ui.RecordContentPanel} contentpanel The content panel to which the record was set.
	 * @param {Zarafa.core.data.IPMRecord} record The record which must be used for initialization.
	 * @param {Zarafa.core.data.IPMRecord} oldrecord The oldrecord which was previously set
	 * @override
	 * @private
	 */
	onSetRecord : function(contentpanel, record, oldrecord)
	{
		Zarafa.common.recurrence.dialogs.RecurrenceContentPanel.superclass.onSetRecord.call(this, contentpanel, record, oldrecord);
		this.updateTitleFromRecord(record);
	},

	/**
	 * Event handler which is fired when the user pressed the "Remove Recurrence" button.
	 * This will delete any recurring information and closes the window.
	 * @private
	 */
	onRemoveRecurrence : function()
	{
		this.record.beginEdit();
		this.record.set('recurring', false);
		this.record.set('recurring_pattern', '');
		this.record.set('recurrence_type', Zarafa.common.recurrence.data.RecurrenceType.NONE);
		this.record.endEdit();

		if (Ext.isDefined(this.modalRecord)) {
			this.modalRecord.applyData(this.record);
		}

		if (this.autoSave !== false) {
			var record = this.modalRecord || this.record;
			this.displayInfoMask();
			this.isSaving = true;
			record.save();
		} else {
			this.close();
		}
	}
});

Ext.reg('zarafa.recurrencecontentpanel', Zarafa.common.recurrence.dialogs.RecurrenceContentPanel);
