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

		var messageType = {};
		var filterSetting = {};
		var searchInCheckBoxSetting = {};
		var searchCriteria = this.getSearchFolderSettings(config.model, config.searchTabId);
		if (searchCriteria) {
			messageType = searchCriteria.messageTypeCheckBoxGroup || {};
			filterSetting = searchCriteria.filterCheckBoxGroup || {};
			searchInCheckBoxSetting = searchCriteria.searchInCheckBoxGroup || {};
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
			iconCls : 'advance_search',
			cls : 'zarafa-search-toolbox',
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
				autoScroll : true,
				items : [
					this.createFoldersFieldset(),
					this.createMessageTypeFieldset(messageType),
					this.createFilterFieldset(filterSetting),
					this.createDateRangeFieldset(dateRangeStore),
					this.createSearchInFieldset(searchInCheckBoxSetting),
					this.createFavoritesContainer(config)
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
	 *
	 * @param {Object} messageType setting object which used to pre-select the check box when
	 * user tring to open saved search folder.
	 *
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createMessageTypeFieldset : function(messageType)
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
				name : 'messageTypeCheckboxGroup',
				hideLabel : true,
				listeners : {
					change : this.onMessageTypeCheckboxChange,
					scope : this
				},
				items : [{
					name : 'mail',
					boxLabel : _('Mails'),
					checked : Ext.isDefined(messageType['mail'])
				},{
					name : 'calendar',
					boxLabel : _('Appointments'),
					checked : Ext.isDefined(messageType['calendar'])
				},{
					name : 'contact',
					boxLabel : _('Contacts'),
					checked : Ext.isDefined(messageType['contact'])
				},{
					name : 'task',
					boxLabel : _('Tasks'),
					checked : Ext.isDefined(messageType['task'])
				},{
					name : 'note',
					boxLabel : _('Notes'),
					checked : Ext.isDefined(messageType['note'])
				}]
			}]
		};
	},

	/**
	 * Creates the filter fieldset for search tool box of form panel.
	 *
	 * @param {Object} filterSetting setting object which used to pre-select the check box when
	 * user tring to open saved search folder.
	 *
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createFilterFieldset : function(filterSetting)
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
				ref : '../../filterCheckBoxGroup',
				hideLabel : true,
				name : 'filterCheckBoxGroup',
				listeners : {
					change : this.onFilterCheckBoxGroup,
					render : this.onRenderCheckboxGroup,
					scope : this
				},
				items : [{
					name : 'message_flags',
					boxLabel : _('Unread'),
					checked : Ext.isDefined(filterSetting['message_flags'])
				},{
					name : 'hasattach',
					boxLabel : _('Attachments'),
					checked : Ext.isDefined(filterSetting['hasattach'])
				}]
			}]
		};
	},

	/**
	 * Creates the date range fieldset for search tool box of form panel.
	 *
	 * @param {Ext.data.JsonStore} dateRangeStore store which contains different date range for
	 * date range combo box.
	 *
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
					beforerender : this.onBeforeRenderDateRangeCombo,
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
					fieldLabel: pgettext('search.date', 'From'),
					labelStyle : 'width : 35px',
					itemCls : 'zarafa-dateperiodfield-itemsCls',
					labelWidth: 50,
					width : 110
				},
				endFieldConfig: {
					labelSeparator : "",
					fieldLabel: pgettext('search.date', 'To'),
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
	 *
	 * @param {Object} searchInCheckBoxSetting setting object which used to pre-select the check box when
	 * user tring to open saved search folder.
	 *
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createSearchInFieldset: function(searchInCheckBoxSetting)
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
				name : 'searchInCheckboxGroup',
				hideLabel : true,
				listeners : {
					change : this.onSearchInCheckboxChange,
					render : this.onRenderCheckboxGroup,
					scope : this
				},
				items : [{
					name : ['sender_name', 'sender_email_address'],
					itemId: 'sender',
					boxLabel : _('Sender'),
					checked : Ext.isDefined(searchInCheckBoxSetting['sender'])
				},{
					name : ['display_to', 'display_cc', 'display_bcc'],
					itemId: 'recipients',
					boxLabel : _('Recipients'),
					checked : Ext.isDefined(searchInCheckBoxSetting['recipients'])
				},{
					name : 'subject',
					itemId : 'subject',
					boxLabel : _('Subject'),
					checked : Ext.isDefined(searchInCheckBoxSetting['subject'])
				},{
					name : 'body',
					itemId : 'body',
					boxLabel : _('Body & Attachments'),
					checked : Ext.isDefined(searchInCheckBoxSetting['body'])
				}]
			}]
		};
	},

	/**
	 * Create the "Search in" {@link Ext.form.CheckboxGroup checkboxgroup} which specifies
	 * which fields search has to look in.
	 * @return {Object} config object for creating {@link Ext.form.FieldSet FieldSet}.
	 * @private
	 */
	createFavoritesContainer : function ()
	{
		return {
			xtype : 'container',
			cls: 'zarafa-search-toolbox-favoritesbutton-container',
			layout:'fit',
			items: [{
				cls: 'search-toolbox-favorites-button',
				xtype:'button',
				text: '<span>' + _('Favorites') + '</span>',
				handler : this.onClickFavorites,
				tooltip : {
					text : _('Add a folder to favorites based on this search query'),
					width : 350
				},
				scope : this
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
			render : this.onRenderCheckboxGroup,
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
	 * Event handler which is raised just before the {@link Ext.form.ComboBox ComboBox}
	 * is being rendered. it will call {@link #getSearchFolderSettings} which
	 * provide saved search folder related setting objects which used to pre-select
	 * date range combo box.
	 *
	 * @param {Ext.form.ComboBox} combo the combo box component.
	 */
	onBeforeRenderDateRangeCombo : function(combo)
	{
		var searchCriteria = this.getSearchFolderSettings();
		if (searchCriteria) {
			var dateRange = searchCriteria.date_range;
			var record = combo.findRecord(combo.valueField, dateRange);
			this.setDateRangeRestriction(combo, record);
			if (!Ext.isObject(dateRange)) {
				combo.setValue(dateRange);
			}else {
				combo.setValue('custom_date');
				this.dateField.hidden = false;
				var startDate = new Date(dateRange.start);
				var dueDate = new Date(dateRange.due);

				this.dateField.startField.setValue(startDate);
				this.dateField.endField.setValue(dueDate);
			}
		}
	},

	/**
	 * Function which used to retrieve the saved search folder related settings object
	 * if we are trying to open it.
	 *
	 * @param {Zarafa.advancesearch.AdvanceSearchContextModel} contextModel (optional) the advance search context model
	 * @param {String} searchStoreUniqueId (optional) searchStoreUniqueId is represent the unique id of
	 * {@link Zarafa.advancesearch.AdvanceSearchStore  AdvanceSearchStore}.
	 *
	 * @returns {Object|Boolean} return settings object of saved search folder else false.
	 */
	getSearchFolderSettings : function(contextModel, searchStoreUniqueId)
	{
		var model = Ext.isDefined(contextModel) ? contextModel : this.model;
		var store = model.store;
		searchStoreUniqueId = Ext.isDefined(searchStoreUniqueId) ? searchStoreUniqueId : store.searchStoreUniqueId;
		if (Ext.isDefined(store.searchFolder[searchStoreUniqueId])) {
			var folder = store.searchFolder[searchStoreUniqueId];
			return container.getSettingsModel().getSettingsObject('zarafa/v1/contexts/search/search_criteria/'+folder.get('entryid'));
		}
		return false;
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
	 * Function which is used to set the date range related restriction
	 * in {@link #searchCriteria} object.
	 *
	 * @param {Ext.form.ComboBox} combo The field which fired the event
	 * @param {Ext.data.Record} record The selected record
	 * @private
	 */
	setDateRangeRestriction : function(combo, record)
	{
		var value = record.get('value');
		var today = new Date();
		// Add a day to implement until
		this.searchCriteria['date_range']['end'] = today.add(Date.DAY, 1).getTime() / 1000;

		if (value !== 'custom_date' && this.dateField.isVisible()) {
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
		this.setDateRangeRestriction(combo, record);
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
		this.setSearchInRestriction(group, checked);
		this.afterUpdateRestriction();
	},

	/**
	 * Sets the search restriction for Search filtering fields.
	 *
	 * @param {Ext.form.CheckboxGroup} group the checkboxgroup
	 * @param {Array} checked an array of {Ext.form.Checkbox} items which are selected
	 */
	setSearchInRestriction : function (group, checked)
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
	 * Event handler was fire when message type/ filter/ search check box group gets rendered.
	 * @param {Ext.form.CheckboxGroup} group the group is {@link Ext.form.CheckboxGroup checkbox}
	 * @private
	 */
	onRenderCheckboxGroup : function(group)
	{
		switch(group.name) {
			case 'filterCheckBoxGroup':
				this.setFilterRestriction(group, group.getValue());
				break;
			case 'searchInCheckboxGroup':
				this.setSearchInRestriction(group, group.getValue());
				break;
			default:
				this.setMessageClassRestriction(group, group.getValue());
		}
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
		const onlyUnique = function(value, index, arr) {
			return arr.indexOf(value) === index;
		};

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
	 * Event handler triggered when "Favorites" button was pressed. it will open
	 * {@link Zarafa.advancesearch.dialogs.CreateSearchFolderPanel CreateSearchFolderPanel}.
	 */
	onClickFavorites : function ()
	{
		var config = {
			searchText : this.dialog.searchText,
			searchStoreEntryId : this.model.getStore().searchStoreEntryId,
			includeSubFolder : this.includeSubFolder.getValue(),
			searchFolderEntryId : this.model.store.searchFolderEntryId
		};
		Zarafa.advancesearch.Actions.openCreateSearchFolderContentPanel(this.model, config);
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
		var orResDate = [];
		var orResSearchField = [];
		var orResMessageClass = [];
		var orFilters = [];

		Ext.iterate(this.searchCriteria, function(key, values) {
			// search field restriction
			if(key === 'search_fields') {
				Ext.each(values, function(value){
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
				Ext.each(values, function(value) {
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
					// Modification date
					orResDate = Zarafa.core.data.RestrictionFactory.createResOr([
						Zarafa.core.data.RestrictionFactory.createResAnd([
							Zarafa.core.data.RestrictionFactory.createResNot(
								Zarafa.core.data.RestrictionFactory.dataResExist('PR_MESSAGE_DELIVERY_TIME')
							),
							Zarafa.core.data.RestrictionFactory.dataResProperty(
								'last_modification_time',
								Zarafa.core.mapi.Restrictions.RELOP_GE,
								values.start
							),
							Zarafa.core.data.RestrictionFactory.dataResProperty(
								'last_modification_time',
								Zarafa.core.mapi.Restrictions.RELOP_LT,
								values.end
							)
						]),
						Zarafa.core.data.RestrictionFactory.createResAnd([
							Zarafa.core.data.RestrictionFactory.dataResExist('PR_MESSAGE_DELIVERY_TIME'),
							Zarafa.core.data.RestrictionFactory.dataResProperty(
								'message_delivery_time',
								Zarafa.core.mapi.Restrictions.RELOP_GE,
								values.start
							),
							Zarafa.core.data.RestrictionFactory.dataResProperty(
								'message_delivery_time',
								Zarafa.core.mapi.Restrictions.RELOP_LT,
								values.end
							)
						])
					]);
				}
			}
			// message class restriction
			if(key === 'message_class' && !Ext.isEmpty(values)) {
				Ext.each(values, function(value){
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
		 * If date informations are present in search criteria then create search restriction
		 * something like this.
		 * AND
		 * 		AND
		 * 			OR
		 * 				AND
		 * 					Not PR_MESSAGE_DELIVERY_TIME exists
		 * 					start date (last_modification_time)
		 * 					end date (last_modification_time)
		 * 				AND
		 * 					PR_MESSAGE_DELIVERY_TIME exists
		 * 					start date (message_delivery_time)
		 * 					end date (message_delivery_time)
		 * 			OR
		 * 				searchFields
		 * 		OR
		 * 			message class
		 * 		OR
		 * 			search filters
		 */
		if(!Ext.isEmpty(orResDate)) {
			var andResDateSearchField = [];
			andResDateSearchField.push(orResDate);
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
