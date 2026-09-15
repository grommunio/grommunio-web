/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.common.flags.dialogs');

/**
 * @class Grommunio.common.flags.dialogs.CustomFlagContentPanel
 * @extends Grommunio.core.ui.ContentPanel
 * @xtype grommunio.customflagcontentpanel
 *
 * Content panel for users for setting the custom flag and reminder on a {@link Grommunio.core.data.IPMRecord record}
 */
Grommunio.common.flags.dialogs.CustomFlagContentPanel = Ext.extend(Grommunio.core.ui.ContentPanel, {
	/**
	 * @cfg {Boolean} setFocusOnReminder True to set the focus on
	 * reminder checkbox.
	 */
	setFocusOnReminder: false,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
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
			xtype: 'grommunio.customflagcontentpanel',
			layout: 'fit',
			title: _('Set custom flag'),
			width: 350,
			height: 220,
			items: [{
				xtype: 'grommunio.customflagpanel',
				ref:'customFlagPanel',
				records: config.record,
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
			listeners: {
				afterrender: function () {
					if (this.setFocusOnReminder) {
						this.inputAutoFocusPlugin.setAutoFocus(this.customFlagPanel.reminderCheckbox);
					}
				},
				scope: this
			}
		});

		Grommunio.common.flags.dialogs.CustomFlagContentPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is called when ok button is press. it will
	 * save the records.
	 */
	onOk: function ()
	{
		const flagProperties = Grommunio.common.flags.Util.getFlagBaseProperties();
		delete flagProperties.reminder;

		var dateRange = this.customFlagPanel.dateField.getValue();
		if(!Ext.isDate(dateRange.getStartDate()) || !Ext.isDate(dateRange.getDueDate())) {
			Ext.apply(flagProperties, {
				startdate: null,
				duedate: null
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
		}, this);

		if (!Ext.isEmpty(this.record)) {
			// Record the flag change in the undo history. This must be done
			// explicitly since ShadowStore saves are not announced through
			// the IPMStoreMgr.
			container.getUndoManager().capturePropertyGesture(this.record);
			this.record[0].getStore().save(this.record);
		}
		this.close();
	},

	/**
	 * Event handler for the destroy event of the component. Will remove the records that
	 * were copied from the shadow store.
	 */
	onDestroy: function()
	{
		container.getShadowStore().remove(this.record);
	}
});
Ext.reg('grommunio.customflagcontentpanel', Grommunio.common.flags.dialogs.CustomFlagContentPanel);
