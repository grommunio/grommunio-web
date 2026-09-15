Ext.namespace('Grommunio.common.delegates.dialogs');

/**
 * @class Grommunio.common.delegates.dialogs.DelegatePermissionPanel
 * @extends Ext.form.FormPanel
 * @xtype grommunio.delegatepermissionpanel
 *
 * Will generate UI for {@link Grommunio.common.delegates.dialogs.DelegatePermissionContentPanel DelegatePermissionContentPanel}.
 */
Grommunio.common.delegates.dialogs.DelegatePermissionPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @cfg {Array} folderTypes array of folder type that will be used
	 * generate permissions combo box field
	 */
	folderTypes: {
		'calendar': _('Calendar'),
		'tasks': _('Tasks'),
		'inbox': _('Inbox'),
		'contacts': _('Contacts'),
		'notes': _('Notes'),
		'journal':_('Journal')
	},

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);
		config.plugins.push('grommunio.recordcomponentupdaterplugin');

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'grommunio.delegatepermissionpanel',
			labelAlign: 'left',
			items: this.createPanelItems()
		});

		Grommunio.common.delegates.dialogs.DelegatePermissionPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will create panel items for {@link Grommunio.common.delegates.dialogs.DelegatePermissionPanel DelegatePermissionPanel}
	 * @return {Array} array of items that should be added to panel.
	 * @private
	 */
	createPanelItems: function()
	{
		return [{
			xtype: 'fieldset',
			style: {
				margin: '10px',
				padding: '10px'
			},
			title: _('This delegate has the following permissions'),
			autoHeight: true,
			autoWidth: true,
			cls: 'grommunio-fieldset',
			labelAlign: 'left',
			items: this.createFieldItems(this.folderTypes)
		}, {
			xtype: 'checkbox',
			boxLabel: _('Delegate can see my private items.'),
			style: 'margin-left: 10px;',
			ref: 'delegatePrivateCheck',
			name: 'can_see_private',
			hideLabel: true,
			checked: false,
			listeners: {
				check: this.onPrivateCheck,
				scope: this
			}
		}];
	},

	/**
	 * Generic function to create check box for delegate meeting rules check box.
	 * @return {Object} config object to create {@link Ext.form.CheckBox CheckBox}.
	 */
	createDelegateMeetingRuleCheck: function()
	{
		return{
			xtype: 'checkbox',
			boxLabel: _('Delegate receives copies of meeting-related messages sent to me.'),
			ref: '../delegateMeetingRuleCheck',
			name: 'has_meeting_rule',
			hideLabel: true,
			checked: false,
			listeners: {
				check: this.onDelegateRuleCheck,
				scope: this
			}
		};
	},

	/**
	 * Generic function to create comboboxes for different permission levels for default folders
	 * of the hierarchy.
	 * @param {Array} type type of the default folder (calendar, inbox, notes etc.)
	 * @return {Array} items array to create a {@link Ext.form.ComboBox ComboBox}.
	 * @private
	 */
	createFieldItems: function(folderTypes)
	{
		var items = [];

		Ext.iterate(folderTypes, function(key, value){
			var profileStore = {
				xtype: 'jsonstore',
				fields: ['name', 'value'],
				data: Grommunio.common.delegates.data.DelegatePermissionProfiles
			};

			var item = {
				xtype: 'combo',
				name: 'rights_' + key,
				boxMinWidth: 200,
				anchor: '100%',
				fieldLabel: value,
				store: profileStore,
				mode: 'local',
				triggerAction: 'all',
				displayField: 'name',
				valueField: 'value',
				lazyInit: false,
				// "Full Control", "No Rights" etc. folder permissions are not supported
				// by the delegate so we just show the "Other" as text in combo box.
				valueNotFoundText: _('Other'),
				forceSelection: true,
				editable: false,
				value: Grommunio.core.mapi.Rights.RIGHTS_NONE,
				listeners: {
					select: this.onProfileSelect,
					scope: this
				}
			};
			items.push(item);

			if(key === 'calendar') {
				items.push(this.createDelegateMeetingRuleCheck());
			}
		}, this);

		return items;
	},

	/**
	 * Updates the panel by loading data from the record into the form panel.
	 * @param {Grommunio.common.delegates.data.DelegateRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	update: function(record, contentReset)
	{
		this.record = record;

		this.getForm().loadRecord(record);

		this.updateUI(record, contentReset);
	},

	/**
	 * Updates the UI of the panel.
	 * @param {Grommunio.common.delegates.data.DelegateRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	updateUI: function(record, contentReset)
	{
		if(contentReset || record.isModifiedSinceLastUpdate('rights_calendar') || record.isModifiedSinceLastUpdate('has_meeting_rule')) {
			var calendarRights = record.get('rights_calendar');
			var lowRights = !calendarRights || calendarRights === Grommunio.core.mapi.Rights.RIGHTS_NONE || calendarRights === Grommunio.core.mapi.Rights.RIGHTS_READONLY;

			// a delegate who is already in the rule must be able to leave it
			this.delegateMeetingRuleCheck.setDisabled(lowRights && !record.get('has_meeting_rule'));
		}
	},

	/**
	 * Update the given {@link Grommunio.core.data.IPMRecord record} with
	 * the values from this {@link Ext.Panel panel}.
	 * @param {Grommunio.core.data.IPMRecord} record The record to update
	 */
	updateRecord: function(record)
	{
		this.getForm().updateRecord(record);
	},

	/**
	 * Handler function that will be called when user selects permission level for
	 * any default folder type. This is a common function for every combobox.
	 * @param {Ext.form.Combobox} comboBox permission level combobox
	 * @param {Ext.data.Record} record currently selected record in the combobox
	 * @param {Number} index index of the currently selected record in combobox
	 * @private
	 */
	onProfileSelect: function(comboBox, record, index)
	{
		var type = comboBox.name;

		this.record.beginEdit();

		// update the record data so we can use it in next function
		this.record.set(type, record.get(comboBox.valueField));

		if(type === 'rights_calendar') {
			var calendarRights = this.record.get(type);

			if (!calendarRights || calendarRights === Grommunio.core.mapi.Rights.RIGHTS_NONE || calendarRights === Grommunio.core.mapi.Rights.RIGHTS_READONLY) {
				this.record.set('has_meeting_rule', false);
			}

			this.updateUI(this.record, false);
		}

		this.record.endEdit();
	},

	/**
	 * Handler function that will be called when user checks/unchecks checkbox of delegate meeting rule,
	 * it will save the checked value to record.
	 * @param {Ext.form.Checkbox} checkBox checkbox for delegate meeting rule.
	 * @param {Boolean} checked current state of the checkbox.
	 * @private
	 */
	onDelegateRuleCheck: function(checkBox, checked)
	{
		this.record.set('has_meeting_rule', checked);
	},

	/**
	 * Handler function that will be called when user checks/unchecks checkbox of delegate private flag,
	 * it will save the checked value to record.
	 * @param {Ext.form.Checkbox} checkBox checkbox for delegate meeting rule.
	 * @param {Boolean} checked current state of the checkbox.
	 * @private
	 */
	onPrivateCheck: function(checkBox, checked)
	{
		this.record.set('can_see_private', checked);
	}
});

Ext.reg('grommunio.delegatepermissionpanel', Grommunio.common.delegates.dialogs.DelegatePermissionPanel);
