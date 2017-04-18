Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SearchToolBoxPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchtoolboxpanel
 *
 */
Zarafa.advancesearch.dialogs.SearchToolBoxPanel = Ext.extend(Ext.Panel, {

	/**
	 * The {@link Zarafa.advancesearch.AdvanceSearchContextModel} which is obtained from
	 * the {@link #context}.
	 *
	 * @property
	 * @type Zarafa.advancesearch.AdvanceSearchContextModel
	 */
	model : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.searchContext)) {
			config.model = config.searchContext.getModel();
		}

		/**
		 * messageClasses contains all message classes which used in advance search.
		 */
		config.messageClasses = {};

		/**
		 * folder on which search gets performed.
		 */
		config.folder = undefined;

		/**
		 * search fields which used to match with search string.
		 */
		config.searchFields = {};

		/**
		 * searchCriteria which contains the search criteria based on this
		 * search criteria search restriction will be form.
		 */
		config.searchCriteria = {};
		config.searchCriteria['date_range'] = {};
		config.searchCriteria['date_range']['start'] = 0;
		config.searchCriteria['date_range']['end'] = 0;

		var dateRangeStore = {
			xtype: 'jsonstore',
			autoDestroy: true,
			fields: ['name', 'value'],
			autoLoad: true,
			data: Zarafa.advancesearch.data.DateRangeFields
		};

		Ext.applyIf(config, {
			xtype : 'zarafa.searchtoolboxpanel',
			title: _('Search tools'),
			width: 175,
			boxMaxWidth : 175,
			boxMinWidth : 175,
			iconCls : 'advance_search',
			cls : 'zarafa-search-toolbox',
			split : true,
			plugins : [{
				ptype : 'zarafa.recordcomponentplugin'
			},{
				ptype : 'zarafa.recordcomponentupdaterplugin'
			}],
			collapsible: true,
			layout: 'fit',
			unstyled: true,
			ref : 'searchToolBox',
			items : [{
				xtype : 'container',
				layout : 'vbox',
				items : [
					this.createFoldersFieldset(),
					this.createMessageTypeFieldset(),
					this.createFilterFieldset(),
					this.createDateRangeFieldset(dateRangeStore),
					this.createSearchInFieldset()
				]
			}]
		});

		this.addEvents(
			/**
			 * @event afterupdaterestriction fired after the {@link #searchCriteria} gets updated by the 
			 * {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel searchToolBox}.
			 * @param {Zarafa.advancesearch.dialogs.SearchToolBoxPanel} searchToolBox which used to triggers/update the search restriction.
			 */
			'afterupdaterestriction'
		);

		Zarafa.advancesearch.dialogs.SearchToolBoxPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Creates the folders fieldset for search tool box of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createFoldersFieldset : function()
	{
		return {
			layout: 'form',
			xtype:'fieldset',
			width : 156,
			border : false,
			title: _('Folders'),
			ref : '../includeSubFolderFieldSet',
			items : [{
				xtype : "checkbox",
				hideLabel : true,
				ref : '../../includeSubFolder',
				boxLabel : _('Include subfolders')
			}]
		};
	},

	/**
	 * Creates the message type fieldset for search tool box of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createMessageTypeFieldset : function()
	{
		return {
			layout: 'form',
			xtype:'fieldset',
			width : 156,
			border : false,
			title: _('Show..'),
			items : [{
				xtype : 'checkboxgroup',
				ref : '../../messageTypeCheckboxGroup',
				columns : 1,
				hideLabel : true,
				listeners : {
					change : this.onMessageTypeCheckboxChange,
					scope : this
				},
				items : [{
					name : 'mail',
					boxLabel : _('Mails')
				},{
					name : 'calendar',
					boxLabel : _('Calendar items')
				},{
					name : 'contact',
					boxLabel : _('Contact items')
				},{
					name : 'task',
					boxLabel : _('Task items')
				},{
					name : 'note',
					boxLabel : _('Note items')
				}]
			}]
		};
	},

	/**
	 * Creates the filter fieldset for search tool box of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createFilterFieldset : function()
	{
		return {
			layout: 'form',
			xtype:'fieldset',
			width : 156,
			border : false,
			title: _('Filter..'),
			items : [{
				xtype : 'checkboxgroup',
				columns : 1,
				hideLabel : true,
				listeners : {
					change : this.onFilterCheckBoxGroup,
					scope : this
				},
				items : [{
					name : 'message_flags',
					boxLabel : _('Unread items')
				},{
					name : 'hasattach',
					boxLabel : _('With attachments')
				}]
			}]
		};
	},

	/**
	 * Creates the date range fieldset for search tool box of form panel.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createDateRangeFieldset : function(dateRangeStore)
	{
		return {
			layout: 'form',
			xtype:'fieldset',
			border : false,
			title: _('Date'),
			items : [{
				xtype: 'combo',
				displayField: 'name',
				editable: false,
				hideLabel : true,
				ref: '../../dateRangeCombo',
				store: dateRangeStore,
				valueField: 'value',
				value: dateRangeStore.data[0].value,
				mode: 'local',
				triggerAction: 'all',
				width: 146,
				listeners: {
					select : this.onSelectCombo,
					scope : this
				}
			},{
				xtype: 'zarafa.dateperiodfield',
				ref: '../../dateField',
				hidden: true,
				allowBlank : false,
				defaultValue : new Zarafa.core.DateRange({
					allowBlank : false ,
					startDate : new Date().add(Date.MONTH, -1),
					dueDate : new Date()
				}),
				startFieldConfig: {
					labelSeparator : "",
					fieldLabel: _('From'),
					labelStyle : 'width : 35px',
					itemCls : 'zarafa-dateperiodfield-itemsCls',
					labelWidth: 50,
					width : 110
				},
				endFieldConfig: {
					labelSeparator : "",
					fieldLabel: _('To'),
					labelStyle : 'width : 35px',
					itemCls : 'zarafa-dateperiodfield-itemsCls',
					labelWidth: 50,
					width : 110
				}
			}]
		};
	},

	/**
	 * Create the "Search in" {@link Ext.form.CheckboxGroup checkboxgroup} which specifies
	 * which fields search has to look in.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createSearchInFieldset: function()
	{
		return {
			layout: 'form',
			xtype:'fieldset',
			width : 160,
			border : false,
			title: _('Search..'),
			items : [{
				xtype : 'checkboxgroup',
				columns : 1,
				ref : '../../searchInCheckboxGroup',
				hideLabel : true,
				listeners : {
					change : this.onSearchInCheckboxChange,
					scope : this
				},
				items : [{
					name : ['sender_name', 'sender_email_address'],
					boxLabel : _('Sender')
				},{
					name : ['display_to', 'display_cc', 'display_bcc'],
					boxLabel : _('Recipients')
				},{
					name : 'subject',
					boxLabel : _('Subject')
				},{
					name : 'body',
					boxLabel : _('Body & Attachments')
				}]
			}]
		};
	},

	/**
	 * Initialize events
	 * @private
	 */
	initEvents : function()
	{
		this.mon(this.messageTypeCheckboxGroup, {
			render : this.onAfterRenderCheckboxGroup,
			scope : this
		});

		this.mon(this.dateRangeCombo, {
			enable : this.onEnableCombo,
			scope : this
		});

		this.mon(this.dateField,{
			change : this.onChangeDateField,
			scope : this
		});

		this.dateField.mon(this.dateField.startField, 'specialkey', this.onSpecialKey, this);
		this.dateField.mon(this.dateField.endField, 'specialkey', this.onSpecialKey, this);
	},

	/**
	 * Event handler is fired for each special key, but it only handles the {@link Ext.EventObjectImp#ENTER} key.
	 * it was call the triggerBlur function of updated date field. which internally fire the 
	 * blur event and blur event fire the change event, which handled by 
	 * {@link Zarafa.common.ui.DatePeriodField#onStartChange} or {@link Zarafa.common.ui.DatePeriodField#onEndChange}
	 * which fire the {@link Zarafa.common.ui.DateRangeField#change} event of {@link Zarafa.common.ui.DateRangeField date rage field}
	 * and it was handled by the {@link #onChangeDateField}.
	 * 
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {Ext.EventObject} eventObj The event object for this event
	 */
	onSpecialKey : function(field, eventObj)
	{
		if (eventObj.getKey() === eventObj.ENTER) {
			field.triggerBlur();
		}
	},

	/**
	 * Event handler which is called when a selection has been made in the
	 * {@link Ext.form.ComboBox combobox}.
	 * @param {Ext.form.ComboBox} combo The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 * @private
	 */
	onSelectCombo : function(combo, record)
	{
		var value = record.get('value');
		var today = new Date();
		// Add a day to implement until
		this.searchCriteria['date_range']['end'] = today.add(Date.DAY, 1).getTime() / 1000;

		if (value !== 'custom_date') {
			this.dateField.hide();
			this.doLayout();
		}

		switch(value) {
			case 'past_week' :
				this.searchCriteria['date_range']['start'] = today.add(Date.DAY, -7).getTime() / 1000;
			break;
			case 'past_two_weeks' :
				this.searchCriteria['date_range']['start'] = today.add(Date.DAY, -14).getTime() / 1000;
			break;
			case 'past_month' :
				this.searchCriteria['date_range']['start'] = today.add(Date.MONTH, -1).getTime() / 1000;
				break;
			case 'past_six_month' :
				this.searchCriteria['date_range']['start'] = today.add(Date.MONTH, -6).getTime() / 1000;
				break;
			case 'past_year' :
				this.searchCriteria['date_range']['start'] = today.add(Date.YEAR, -1).getTime() / 1000;
				break;
			case 'custom_date' :
				this.dateField.show();
				this.doLayout();
				this.searchCriteria['date_range']['start'] = this.dateField.startField.getValue().getTime() / 1000;
				// Add a day to implement until
				this.searchCriteria['date_range']['end'] = this.dateField.endField.getValue().add(Date.DAY, 1).getTime() / 1000;
				break;
			default :
				this.searchCriteria['date_range']['start'] = 0; 
				this.searchCriteria['date_range']['end'] = 0; 
		}


		this.afterUpdateRestriction();
	},

	/**
	 * Event handler for the {@link Ext.form.CheckboxGroup#change change} event, this will
	 * update the {@link #searchCriteria}, which used in advance search request.
	 *
	 * @param {Ext.form.CheckboxGroup} group the checkboxgroup
	 * @param {Array} checked an array of {Ext.form.Checkbox} items which are selected
	 */
	onFilterCheckBoxGroup : function(group, checked)
	{
		this.setFilterRestriction(group, checked);
		this.afterUpdateRestriction();
	},

	/**
	 * Event handler for the {@link Ext.form.CheckboxGroup#change change} event, this will
	 * update the {@link #searchCriteria}, which used in advance search request.
	 *
	 * @param {Ext.form.CheckboxGroup} group the checkboxgroup
	 * @param {Array} checked an array of {Ext.form.Checkbox} items which are selected
	 */
	onMessageTypeCheckboxChange: function(group, checked)
	{
		this.setMessageClassRestriction(group, checked);
		this.afterUpdateRestriction();
	},

	/**
	 * Event handler for the {@link Ext.form.CheckboxGroup#change change} event, this will
	 * update the {@link #searchCriteria} and restricts the "search_fields" so that it only
	 * contains fields which are selected.
	 *
	 * @param {Ext.form.CheckboxGroup} group the checkboxgroup
	 * @param {Array} checked an array of {Ext.form.Checkbox} items which are selected
	 */
	onSearchInCheckboxChange: function(group, checked)
	{
		if (Ext.isEmpty(checked)) {
			// Set the search_fields restriction based the current selected messageClasses.
			this.setMessageClassRestriction(this.messageTypeCheckboxGroup, this.messageTypeCheckboxGroup.getValue());
		} else {
			var searchFields = [];
			checked.forEach(function(checkBox) {
				searchFields = searchFields.concat(checkBox.name);
			});
			this.searchCriteria['search_fields'] = searchFields;
		}

		this.afterUpdateRestriction();
	},

	/**
	 * Function call after the {@link #searchCriteria} gets updated
	 * by {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel search tool box}. This
	 * will fire the {@link #afterupdaterestriction} which triggers the advance search.
	 */
	afterUpdateRestriction : function()
	{
		this.fireEvent('afterupdaterestriction' , this);
	},

	/**
	 * Event handler was fire after the message type check box group gets rendered.
	 * @param {Ext.form.CheckboxGroup} group the group is {@link Ext.form.CheckboxGroup checkbox}
	 * @private
	 */
	onAfterRenderCheckboxGroup : function(group)
	{
		this.setMessageClassRestriction(group, []);
	},

	/**
	 * Sets the search restriction for extra filtering fields.
	 *
	 * @param {Ext.form.CheckboxGroup} group the group is {@link Ext.form.CheckboxGroup checkbox}
	 * @param {Array} checked an array of {Ext.form.Checkbox} items which are selected
	 */
	setFilterRestriction : function(group, checked)
	{
		this.searchCriteria['extra_fields'] = checked.map(function(checkbox) { return checkbox.name; });
	},

	/**
	 * Sets the search restriction for message classes based on the checkboxes which are available,
	 * if no checkboxes are selected we want to search through all available message and searchfields.
	 *
	 * @param {Ext.form.CheckboxGroup} group the {@link Ext.form.CheckboxGroup checkbox} group
	 * @param {Array} checked a list of checkboxes which are enabled
	 */
	setMessageClassRestriction : function(group, checked)
	{
		// Helper to filter out duplicates
		function onlyUnique(value, index, arr) {
			return arr.indexOf(value) === index;
		}

		var messageClasses = [];
		var searchFields = [];

		if (Ext.isEmpty(checked)) {
			checked = group.items.items;
		}

		var searchInCheckBox = this.searchInCheckboxGroup.getValue();
		var searchInCheckBoxFields = [];
		if (!Ext.isEmpty(searchInCheckBox)) {
			searchInCheckBox.forEach(function (checkBox) {
				searchInCheckBoxFields = searchInCheckBoxFields.concat(checkBox.name);
			}, this);
		}

		checked.forEach(function(checkBox) {
			messageClasses = messageClasses.concat(this.getMessageClass(checkBox.name));
			// searchInCheckBox has high priority, If any of the checkBox selected from that
			// then don't add/contact default search fields in searchFields array.
			if (Ext.isEmpty(searchInCheckBoxFields)) {
				searchFields = searchFields.concat(Zarafa[checkBox.name].data.SearchFields[0].value.split(' '));
			}
		}, this);

		if (!Ext.isEmpty(searchInCheckBoxFields)) {
			searchFields = searchInCheckBoxFields;
		}

		this.searchCriteria['message_class'] = messageClasses.filter(onlyUnique);
		this.searchCriteria['search_fields'] = searchFields.filter(onlyUnique);
	},

	/**
	 * Function is use to retive the message class based on the selected 
	 * {@link #createMessageTypeFieldset}.
	 * @param {String} checkBoxName The checkBoxName of the selected check box from check box list
	 * @return {Array} return and array of message classes.
	 */
	getMessageClass : function(checkBoxName)
	{
		switch(checkBoxName) {
			case 'mail':
				return ['IPM.Note'];
			case 'calendar':
				return ['IPM.Appointment', 'IPM.Schedule'];
			case 'contact':
				return ['IPM.Contact', 'IPM.DistList'];
			case 'task':
				return ['IPM.Task'];
			case 'note':
				return ['IPM.StickyNote'];
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.DateRangeField} has been changed.
	 * This will update the start and due date inside the {@link #searchCriteria} accordingly.
	 *
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newRange The new date range
	 * @param {Mixed} oldRange The old date range
	 * @private
	 */
	onChangeDateField : function(field, newRange, oldRange)
	{
		var newStartDate = newRange.startDate.getTime()/1000;
		// Add a day to implement until
		var newDueDate = newRange.dueDate.add(Date.DAY, 1).getTime()/1000;

		this.searchCriteria['date_range']['start'] = newStartDate;
		this.searchCriteria['date_range']['end'] = newDueDate;

		if(newRange.compare(oldRange) !== 0) {
			this.afterUpdateRestriction();
		}
	},

	/**
	 * Event handler triggers after the date range combo box gets enabled.
	 * also it will update the {@link #searchCriteria} based on the selected 
	 * value of the combo box.
	 * 
	 * @param {Ext.form.ComboBox} combo which gets enabled.
	 * @private
	 */
	onEnableCombo : function(combo)
	{
		var index = combo.getStore().find('value', combo.getValue());
		var record = combo.getStore().getAt(index);
		this.onSelectCombo(combo, record);
	},

	/**
	 * Function will be used to create search restriction based on value entered in
	 * search textfield and {@link Zarafa.common.search.dialogs.SearchToolBoxPanel SearchToolBox}.
	 *  
	 * In words: all terms must occur at least once, but it doesn't matter in which of the fields they occur.
	 *
	 * @param {String} textFieldValue value of search text field.
	 * @return {Object} Object that will be passed as restriction to server.
	 * @private
	 */
	createRestriction : function(textFieldValue)
	{
		if (Ext.isEmpty(textFieldValue)) {
			return [];
		}

		var finalRes = [];
		var andRes = [];
		var andResDate = [];
		var orResSearchField = [];
		var orResMessageClass = [];
		var orFilters = [];

		Ext.iterate(this.searchCriteria, function(key, values, Object) {
			// search field restriction
			if(key === 'search_fields') {
				Ext.each(values, function(value, index, values){
					orResSearchField.push(
						Zarafa.core.data.RestrictionFactory.dataResContent(
							value,
							Zarafa.core.mapi.Restrictions.FL_SUBSTRING | Zarafa.core.mapi.Restrictions.FL_IGNORECASE,
							textFieldValue
						)
					);
				}, this);
			}

			if (key === 'extra_fields') {
				Ext.each(values, function(value, index, values) {
					if (value === 'hasattach') {
						orFilters.push(
							Zarafa.core.data.RestrictionFactory.dataResProperty(
								value,
								Zarafa.core.mapi.Restrictions.RELOP_EQ,
								true
								)
						);
					}
					if (value === 'message_flags') {
						orFilters.push(
							Zarafa.core.data.RestrictionFactory.dataResBitmask(
								value,
								Zarafa.core.mapi.Restrictions.BMR_EQZ,
								Zarafa.core.mapi.MessageFlags.MSGFLAG_READ
							)
						);
					}
				});
			}

			// Date Range restriction 
			if(key === 'date_range') {
				if(values.start !== 0 && values.end !== 0) {
					andResDate.push(
						Zarafa.core.data.RestrictionFactory.dataResProperty(
							'last_modification_time',
							Zarafa.core.mapi.Restrictions.RELOP_GE,
							values.start
						)
					);
					andResDate.push(
						Zarafa.core.data.RestrictionFactory.dataResProperty(
							'last_modification_time',
							Zarafa.core.mapi.Restrictions.RELOP_LT,
							values.end
						)
					);
				}
			}
			// message class restriction 
			if(key === 'message_class' && !Ext.isEmpty(values)) {
				Ext.each(values, function(value, index, values){
					orResMessageClass.push(
						Zarafa.core.data.RestrictionFactory.dataResContent(
							key,
							Zarafa.core.mapi.Restrictions.FL_PREFIX | Zarafa.core.mapi.Restrictions.FL_IGNORECASE,
							value
						)
					);
				}, this);
			}
		}, this);

		/**
		 * It date informations are present in search criteria then create search restriction
		 * something like this.
		 * AND
		 * 		AND
		 * 			AND
		 * 				start date 
		 * 				end date
		 * 			OR
		 * 				searchFields
		 * 		OR
		 * 			message class
		 * 		OR
		 * 			search filters
		 */
		if(!Ext.isEmpty(andResDate)) {
			var andResDateSearchField = [];
			andResDateSearchField.push(Zarafa.core.data.RestrictionFactory.createResAnd(andResDate));
			andResDateSearchField.push(Zarafa.core.data.RestrictionFactory.createResOr(orResSearchField));
			andRes.push(Zarafa.core.data.RestrictionFactory.createResAnd(andResDateSearchField));
		} else {
			/**
			 * If date information is not present in search criteria then create search restriction
			 * something like this.
			 * AND
			 * 		OR
			 * 			searchFields
			 * 		OR
			 * 			message class
			 * 		OR
			 * 			search filters
			 */
			andRes.push(Zarafa.core.data.RestrictionFactory.createResOr(orResSearchField));
		}

		// Message class restriction which indicates which type of message you want to search.
		andRes.push(Zarafa.core.data.RestrictionFactory.createResOr(orResMessageClass));

		if (!Ext.isEmpty(orFilters)) {
			andRes.push(Zarafa.core.data.RestrictionFactory.createResAnd(orFilters));
		}

		if(!Ext.isEmpty(andRes)) {
			finalRes = Zarafa.core.data.RestrictionFactory.createResAnd(andRes);
		}


		return finalRes;
	}
});

Ext.reg('zarafa.searchtoolboxpanel', Zarafa.advancesearch.dialogs.SearchToolBoxPanel);

