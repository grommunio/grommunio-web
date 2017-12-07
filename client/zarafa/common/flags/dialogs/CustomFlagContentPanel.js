Ext.namespace('Zarafa.common.flags.dialogs');

/**
 * @class Zarafa.common.flags.dialogs.CustomFlagContentPanel
 * @extends Zarafa.core.ui.ContentPanel
 * @xtype zarafa.customflagcontentpanel
 *
 * Content panel for users for setting the custom flag and reminder on a {@link Zarafa.core.data.IPMRecord record}
 */
Zarafa.common.flags.dialogs.CustomFlagContentPanel = Ext.extend(Zarafa.core.ui.ContentPanel, {
	/**
	 * @cfg {Boolean} setFocusOnReminder True to set the focus on
	 * reminder checkbox.
	 */
	setFocusOnReminder : false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		// Add the records to the shadow store, because otherwise we cannot
		// save them when the mail grid refreshes while we have this Content Panel open.
		var shadowStore = container.getShadowStore();
		config.record = config.record.map(function(record){
			record = record.copy();
			shadowStore.add(record);
			return record;
		});

		config = Ext.applyIf(config, {
			xtype : 'zarafa.customflagcontentpanel',
			layout : 'fit',
			title : _('Set custom flag'),
			width: 350,
			height: 160,
			items: [{
				xtype: 'zarafa.customflagpanel',
				ref :'customFlagPanel',
				records : config.record,
				buttons: [{
					text: _('Ok'),
					handler: this.onOk,
					scope: this
				},{
					text: _('Cancel'),
					handler: this.close,
					scope: this
				}]
			}],
			listeners : {
				afterrender : function () {
					if (this.setFocusOnReminder) {
						this.inputAutoFocusPlugin.setAutoFocus(this.customFlagPanel.reminderCheckbox);
					}
				},
				scope: this
			}
		});

		Zarafa.common.flags.dialogs.CustomFlagContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is called when ok button is press. it will
	 * save the records.
	 */
	onOk : function ()
	{
		const flagProperties = Zarafa.common.flags.Util.getFlagBaseProperties();
		delete flagProperties.reminder;

		var dateRange = this.customFlagPanel.dateField.getValue();
		if(!Ext.isDate(dateRange.getStartDate()) || !Ext.isDate(dateRange.getDueDate())) {
			Ext.apply(flagProperties, {
				startdate : null,
				duedate : null
			});
			if(!this.record[0].get('reminder')) {
				Ext.apply(flagProperties, {
					reminder:		false,
					reminder_time:		null,
					flag_due_by:		null
				});
			}
		}

		this.record.forEach(function (record) {
			record.beginEdit();
			for ( var property in flagProperties ){
				record.set(property, flagProperties[property]);
			}
			record.endEdit();
			record.save();
		}, this);
		this.close();
	},

	/**
	 * Event handler for the destroy event of the component. Will remove the records that
	 * were copied from the shadow store.
	 */
	onDestroy : function()
	{
		container.getShadowStore().remove(this.record);
	}
});
Ext.reg('zarafa.customflagcontentpanel', Zarafa.common.flags.dialogs.CustomFlagContentPanel);
