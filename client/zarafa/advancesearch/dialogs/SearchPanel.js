Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SearchPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchpanel
 *
 */
Zarafa.advancesearch.dialogs.SearchPanel = Ext.extend(Ext.Panel, {

	/**
	 * @cfg{Object} searchContentPanel which contains {@link Zarafa.advancesearch.dialogs.SearchPanel searchPanel}
	 */
	searchContentPanel : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		var searchContext = container.getContextByName('advancesearch');
		if (!Ext.isDefined(config.model) && Ext.isDefined(searchContext)) {
			config.model = searchContext.getModel();
			if(Ext.isDefined(config.searchFolder)) {
				config.model.store.searchFolder[config.searchTabId] = config.searchFolder;
			}
			var parentModel = container.getCurrentContext().getModel();
			searchContext.enable(parentModel.getDefaultFolder(), true);
		}

		Ext.applyIf(config, {
			xtype : 'zarafa.searchpanel',
			layout : 'border',
			border : false,
			items : [{
				xtype : 'zarafa.searchtoolboxpanel',
				searchContext : searchContext,
				searchTabId : config.searchTabId,
				collapsed : Ext.isDefined(config.searchFolder),
				region :'west',
				scope : this
			},{
				xtype : 'zarafa.searchcenterpanel',
				searchContext : searchContext,
				searchTabId : config.searchTabId,
				region : 'center',
				searchPanel: this,
				scope : this
			},{
				xtype : 'zarafa.searchtoolbarpanel',
				searchContext : searchContext,
				searchText : config.searchText,
				region : 'north',
				scope : this
			}]
		});

		Zarafa.advancesearch.dialogs.SearchPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function called by Extjs when the panel has been {@link #render rendered}.
	 * At this time all events can be registered.
	 * @private
	 */
	initEvents : function()
	{
		this.mon(this.centerRegion.getSearchResultPreviewPanel(),{
			afterupdatesearchpreviewpanel : this.onAfterUpdateSearchPreviewPanel,
			scope : this
		});

		this.mon(this.searchContentPanel,{
			beforeclose : this.onBeforeCloseContentPanel,
			scope : this
		});

		// Events registered on Search grid.
		this.mon(this.centerRegion.switchBorder.searchGrid,{
			resize : this.onSearchGridResize,
			scope : this
		});

		this.mon(this.searchToolBox,{
			afterupdaterestriction : this.onAfterUpdateRestriction,
			scope : this
		});

		this.mon(this.searchToolBox, 'afterlayout',this.onAfterRenderSearchToolBox, this, {single: true});

		this.mon(this.model, {
			searchfinished : this.onModelSearchFinished,
			searchexception :  this.onModelSearchException,
			scope : this
		});

		this.mon(this.searchToolBox.includeSubFolderFieldSet, {
			beforerender : this.onBeforeRenderSubFolderFieldSet,
			scope : this
		});

		this.mon(this.searchToolBox.includeSubFolder, {
			check : this.onCheckIncludeSubFolder,
			render : this.onRenderSubFolderCheckbox,
			scope : this
		});

		// Events registered on Advance Search field.
		this.searchToolbar.mon(this.searchToolbar.getAdvanceSearchField(),{
			render : this.onRenderSearchTextField,
			valid : this.onValidSearchTextField,
			change : this.onChangeSearchTextField,
			start : this.onSearchStart,
			stop : this.onSearchStop,
			scope : this
		});

		this.searchToolbar.mon(this.searchToolbar.getSearchFolderCombo(),{
			render : this.onRenderSearchFolderCombo,
			select : this.onSelectSearchFolderComboValue,
			beforeselect : this.onBeforeSelectSearchFolder,
			scope : this
		});

		this.mon(container,{
			 'aftercontextswitch' : this.onAfterContextSwitch,
			 scope : this
		});

		this.mon(container.getHierarchyStore(), 'addFolder', this.onHierarchyAddFolder, this);
		this.mon(container.getHierarchyStore(), 'removeFolder', this.onHierarchyRemoveFolder, this);
	},

	/**
	 * Event handler triggers when folder was added in hierarchy. function was
	 * responsible to save the search criteria in settings.
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStore mapi store in which new folders are added.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord/Zarafa.hierarchy.data.MAPIFolderRecord[]} record folder record(s) which are added in hierarchy.
	 * @private
	 */
	onHierarchyAddFolder : function(store, mapiStore, record)
	{
		if (Ext.isArray(record)) {
			record.forEach(function (record) {
				this.onHierarchyAddFolder(store, mapiStore, record);
			},this);
			return;
		}
		var searchStore = this.model.getActiveStore();
		var searchStoreUniqueId = searchStore.searchStoreUniqueId;
		var searchToolBox = this.searchToolBox;
		if (record.isSearchFolder() && searchStoreUniqueId === searchToolBox.searchTabId) {
			searchStore.searchFolder[searchStore.searchStoreUniqueId] = record;

			this.suspendEvents();
			var obj = {};
			var searchInCheckBoxGroup = searchToolBox.searchInCheckboxGroup.getValue();
			var messageTypeCheckBoxGroup = searchToolBox.messageTypeCheckboxGroup.getValue();
			var filterCheckBoxGroup = searchToolBox.filterCheckBoxGroup.getValue();
			var dateRangeDropdown = searchToolBox.dateRangeCombo;

			obj['searchInCheckBoxGroup'] = {};
			obj['messageTypeCheckBoxGroup'] = {};
			obj['filterCheckBoxGroup'] = {};
			obj["search_text"] = this.searchText;
			obj["search_folder_combo"] = {};

			searchInCheckBoxGroup.forEach(function(item){
				obj['searchInCheckBoxGroup'][item.itemId] = true;
			}, this);

			messageTypeCheckBoxGroup.forEach(function(item){
				obj['messageTypeCheckBoxGroup'][item.name] = true;
			}, this);

			filterCheckBoxGroup.forEach(function(item){
				obj['filterCheckBoxGroup'][item.name] = true;
			}, this);

			if (dateRangeDropdown.getValue() === 'custom_date') {
				obj["date_range"] = {};
				Ext.apply(obj["date_range"], {
					start : searchToolBox.dateField.getValue().getStartDate().getTime(),
					due  : searchToolBox.dateField.getValue().getDueDate().getTime()
				});
			} else {
				obj["date_range"] = dateRangeDropdown.getValue();
			}

			var searchFolderCombo = this.searchToolbar.getSearchFolderCombo();
			var folder = searchFolderCombo.getStore().getAt(searchFolderCombo.getStore().find('value',searchFolderCombo.getValue()));
			if(folder.get('flag') === Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.ALL_FOLDERS) {
				obj["search_folder_combo"]["folder_type"] = folder.get('flag');
			} else {
				obj["search_folder_combo"]["folder_entryid"] = folder.get('value');
				obj["search_folder_combo"]["folder_name"] = folder.get('name');
				obj["search_folder_combo"]["folder_type"] = folder.get('flag');
				obj["search_folder_combo"]["include_subfolder"] = folder.get('include_subfolder');
			}
			container.getSettingsModel().set('zarafa/v1/contexts/search/search_criteria/'+record.get('entryid'), obj);
			this.resumeEvents();
		}
	},

	/**
	 * Event handler triggers when folder was remove in hierarchy. function was
	 * responsible to verify that search tab is still exist of folder which was removed.
	 * If search tab is still open then set 'keepSearchFolder' flags true.
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store The store which fired the event
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} mapiStore mapi store in which new folders was removed.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord/Zarafa.hierarchy.data.MAPIFolderRecord[]} record folder record(s) which was removed in hierarchy.
	 * @private
	 */
	onHierarchyRemoveFolder: function (store, mapiStore, record)
	{
		var searchStore = this.model.getActiveStore();
		var searchStoreRecord = searchStore.searchFolder[this.searchToolBox.searchTabId];
		if (searchStoreRecord && Zarafa.core.EntryId.compareEntryIds(searchStoreRecord.get('entryid'), record.get('entryid'))) {
			record.addMessageAction('keepSearchFolder', true);
		}
	},

	/**
	 * Event handler triggers when context was switch successfully.
	 * It was set the parent search field because after the switching context
	 * search field of parent context gets destroy so we need to update the parent
	 * search field object and also required to {#reinitializeEvents}
	 *
	 * @param {Object} folders contains folder details
	 * @param {Context} oldParentContext previously selected context
	 * @param {Context} newParentContext selected context
	 */
	onAfterContextSwitch : function(folders, oldParentContext, newParentContext)
	{
		var activeItem = container.getTabPanel().getActiveTab().getActiveItem();
		var topToolbar = activeItem.getTopToolbar();
		var parentSearchField;

		if (Ext.isDefined(topToolbar) && Ext.isDefined(parentSearchField = topToolbar.searchTextfield)) {
			this.searchContentPanel.setParentSearchField(parentSearchField);
		} else {
			this.searchContentPanel.setParentSearchField(undefined);
		}
	},

	/**
	 * Event handler triggered before {@link Zarafa.advancesearch.dialogs.SearchContentPanel searchcontentpanel}
	 * gets close. it will call the {#onSearchStop} which stop the search.
	 * @param {Zarafa.advancesearch.dialogs.SearchContentPanel} contentPanel which gets the close
	 */
	onBeforeCloseContentPanel : function(contentPanel)
	{
		this.resetParentSearchField();
		var parentSearchField = this.searchContentPanel.getParentSearchField();
		if (parentSearchField) {
			parentSearchField.searchPanelRendered = false;
		}

		/**
		 * when user tries to close the search tab which is not currently active tab,
		 * it will find the closing search tab store and set it to active store in model, so when stopSearch
		 * function of model is call to remove the search folder on server side it will send correct search folder
		 * entry id
		 */
		var currentSearchStore = false;
		var model = this.model;
		if (model.getActiveStore().getSearchStoreUniqueId() !== contentPanel.name){
			currentSearchStore = this.model.store;
			var store = model.stores[contentPanel.name];
			model.setActiveStore(store);
		}

		this.onSearchStop();

		/**
		 * Model has hold the selected record in Zarafa.core.ContextModel.selectedRecords config
		 * so when close the search panel we have to clear the selection manually.
		 */
		if (Ext.isDefined(model.getSelectedRecords())) {
			model.setSelectedRecords(undefined);
		}

		// search tab is going to close so remove the search store from stores object
		model.discardStore(contentPanel.name);

		/**
		 * After removed search folder on server side and close the search tab we need
		 * to again set the active search tab store in model.
 		 */
		if(currentSearchStore !== false) {
			model.setActiveStore(currentSearchStore);
		}
	},

	/**
	 * Event handler which will be called when the {@link #model} fires the
	 * {@link Zarafa.core.ContextModel#searchfinished} event. This will update
	 * the UI to indicate that the search is no longer running and enable the
	 * components that a new search might be created.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @private
	 */
	onModelSearchFinished : function(model)
	{
		this.resetParentSearchField();
		this.searchToolbar.getAdvanceSearchField().hideMask();
	},

	/**
	 * Function is reset the {@link Zarafa.common.searchfield.ui.SearchTextField SearchTextField}
	 * if parent context has.
	 */
	resetParentSearchField : function()
	{
		var parentSearchField = this.searchContentPanel.getParentSearchField();
		if (Ext.isDefined(parentSearchField)) {
			parentSearchField.reset();
			parentSearchField.hideMask();
		}
	},

	/**
	 * Event handler which will be called when the {@link #model} fires the
	 * {@link Zarafa.core.ContextModel#searchexception} event. This will
	 * show an error message indicating that the search has failed.
	 *
	 * @param {Zarafa.core.ContextModel} model The model which fired the event
	 * @param {Zarafa.core.data.IPMProxy} proxy object that received the error
	 * and which fired exception event.
	 * @param {String} type 'request' if an invalid response from server received,
	 * 'remote' if valid response received from server but with succuessProperty === false.
	 * @param {String} action Name of the action {@link Ext.data.Api.actions}.
	 * @param {Object} options The options for the action that were specified in the request.
	 * @param {Object} response response received from server depends on type.
	 * @param {Mixed} args
	 * @private
	 */
	onModelSearchException : function(model, proxy, type, action, options, response, args)
	{
		var searchTextfield = this.searchToolbar.getAdvanceSearchField();
		searchTextfield.hideMask();
		searchTextfield.focus();
	},

	/**
	 * Function will be used to start actual search on {@link Zarafa.core.data.ListModuleStore ListModuleStore},
	 * and also it will register event on {@link Zarafa.core.data.ListModuleStore ListModuleStore} to get
	 * updated status of search.
	 * @param {Zarafa.common.searchfield.ui.SearchTextField} advanceSearchField the advance search field which
	 * performs the search.
	 * @private
	 */
	onSearchStart : function(advanceSearchField)
	{
		var searchText = advanceSearchField.getValue();
		this.searchContentPanel.searchText = searchText;
		var searchField = this.searchToolbar.getAdvanceSearchField();

		this.searchContentPanel.setTitle(searchText);
		if(searchField.getValue() !== searchText) {
			searchField.setValue(searchText);
		}

		var restriction = this.searchToolBox.createRestriction(searchText);
		var searchFolderCombo = this.searchToolbar.getSearchFolderCombo();
		var folder = container.getHierarchyStore().getFolder(searchFolderCombo.getValue());

		var record = searchFolderCombo.findRecord('value', searchFolderCombo.getValue());
		var includeSubFolders = record.get('include_subfolder');

		this.model.startSearch(restriction , includeSubFolders, {'folder' : folder});

		// if search is performed from the parent search field then, it will set the search tab
		// to active tab.
		var tabPanel = container.getTabPanel();
		tabPanel.setActiveTab(this.searchContentPanel);
	},

	/**
	 * Function will be used to execute stop search request on {@link Zarafa.core.data.ListModuleStore ListModuleStore},
	 * it will also unregister event on store to for getting updates of search status.
	 * @private
	 */
	onSearchStop : function()
	{
		var store = this.model.getActiveStore();
		if (!Ext.isDefined(store.searchFolder[store.searchStoreUniqueId])) {
			this.model.stopSearch();
		} else {
			// If the search folder does not exists in the hierarchy,
			// Then execute the stop search request.
			var hierarchyStore = container.getHierarchyStore();
			var defaultStore = hierarchyStore.getDefaultStore();
			if (defaultStore.getFavoritesStore().findExact('entryid', store.searchFolderEntryId) === -1) {
				this.model.stopSearch();
			}
			delete store.searchFolder[store.searchStoreUniqueId];
		}

		if(Ext.isDefined(this.searchToolbar)) {
			this.searchToolbar.getAdvanceSearchField().focus();
		}
	},

	/**
	 * Event handler triggers when {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel search tool box}
	 * layout was rendered also it will start the search.
	 * @param {Zarafa.advancesearch.dialogs.SearchToolBoxPanel} searchToolBox The search tool box panel.
	 */
	onAfterRenderSearchToolBox : function()
	{
		var searchField = this.searchToolbar.getAdvanceSearchField();
		searchField.searchPanelRendered = this.rendered;

		var store = this.model.getActiveStore();
		if (Ext.isDefined(store.searchFolder[store.searchStoreUniqueId])) {
			var folder = store.searchFolder[store.searchStoreUniqueId];

			// Load a new set of folders from the store.
			var data = Ext.applyIf({}, {
				'folder' : folder
			});

			store.load(data);
			store.hasSearchResults = true;
		} else {
			// Trigger search operation.
			searchField.onTriggerClick();
		}
	},

	/**
	 * Event handler triggers when {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel#searchCriteria}
	 * gets update. it will trigger the advance search.
	 */
	onAfterUpdateRestriction : function()
	{
		this.searchToolbar.getAdvanceSearchField().onTriggerClick();
	},

	/**
	 * Event handler triggers when {@link Zarafa.common.searchfield.ui.SearchTextField SearchTextField}
	 * gets render and also it will set the search text in search field.
	 *
	 * @param {Zarafa.common.searchfield.ui.SearchTextField} searchTextField the search text field which
	 * contains the search string.
	 */
	onRenderSearchTextField : function(searchTextField)
	{
		var searchFolderSettingObj = this.searchToolBox.getSearchFolderSettings();
		if (searchFolderSettingObj) {
			searchTextField.setValue(searchFolderSettingObj.search_text);
		} else {
			searchTextField.setValue(this.searchText);
		}
	},

	/**
	 * Event handler triggered when value of {@link Zarafa.common.searchfield.ui.SearchTextField Search text field}
	 * was validated.
	 *
	 * @param {Zarafa.common.searchfield.ui.SearchTextField} searchTextField search text field which contains
	 * search text.
	 */
	onValidSearchTextField : function(searchTextField)
	{
		this.searchText = searchTextField.getValue();
	},

	/**
	 * Event handler triggered when value of search text field has been changed.
	 *
	 * @param {Zarafa.common.searchfield.ui.SearchTextField} searchTextField search text field which contains
	 * @param {String} newValue new value of search text field.
	 * @param {String} oldValue old value of search text field.
	 */
	onChangeSearchTextField : function(searchTextField, newValue, oldValue)
	{
		this.searchText = newValue;
	},

	/**
	 * Event handler triggers when {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}
	 * is render. it will update the {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}
	 * store with parent search folder
	 *
	 * @param {Zarafa.common.searchfield.ui.SearchTextField} searchTextField the search text field which
	 * contains the search string.
	 */
	onRenderSearchFolderCombo : function(searchFolderCombo)
	{
		var searchFolderSettingObj = this.searchToolBox.getSearchFolderSettings();
		if (searchFolderSettingObj) {
			var searchComboSettingObj = searchFolderSettingObj['search_folder_combo'];
			var store = searchFolderCombo.getStore();
			var value;

			if (searchComboSettingObj['folder_type'] === Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.ALL_FOLDERS) {
				var folder = store.getAt(store.find('flag', searchComboSettingObj['folder_type']));
				value = folder.get('value');
			} else {
				var index = 0;
				if (searchComboSettingObj['folder_type'] === Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.CURRENT_SELECTED_FOLDER) {
					index = 1;
					store.removeAt(index);
				} else if (store.getAt(0).get('flag') === Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.IMPORTED_FOLDER) {
					store.removeAt(index);
				}
				var folder = new Ext.data.Record({
					'name' : searchComboSettingObj['folder_name'],
					'value' : searchComboSettingObj['folder_entryid'],
					'flag' : searchComboSettingObj['folder_type'],
					'include_subfolder': searchComboSettingObj['include_subfolder']
				});
				store.insert(index, folder);
				value = searchComboSettingObj['folder_entryid'];
			}
			searchFolderCombo.setValue(value);
		} else {
			searchFolderCombo.store.clearData();
			var parentSearchFolderCombo = this.searchContentPanel.getParentSearchFolderCombo();
			parentSearchFolderCombo.store.getRange().forEach(function (record) {
				searchFolderCombo.store.add(record.copy());
			});
			var value = parentSearchFolderCombo.getValue();
			searchFolderCombo.setValue(value);
		}

	},

	/**
	 * Event handler triggered when selection was performed on
	 * {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}.
	 * function was used to check/un-check "Include sub folder" checkbox which belongs to
	 * {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel SearchToolBox}.
	 *
	 * @param {Zarafa.common.searchfield.ui.SearchFolderCombo} combo The combo box which fired the event.
	 * @param {Ext.data.Record} record The data record returned from the underlying store
	 * @param {number} index The index of the selected item in the drop down list
	 */
	onSelectSearchFolderComboValue : function(combo, record, index)
	{
		var subFolderCheckBox = this.searchToolBox.includeSubFolder;
		subFolderCheckBox.setValue(record.get('include_subfolder'));
		this.onRenderSubFolderCheckbox(subFolderCheckBox);
	},

	/**
	 * Event handler which is raised just before the {@link Ext.form.FieldSet IncludeSubFolderFieldSet}
	 * is being rendered. it will hide the {@link Ext.form.FieldSet IncludeSubFolderFieldSet} if
	 * selected folder is does not support the search folder.
	 *
	 * @param {Ext.form.FieldSet} fieldSet field set which fire this event.
	 */
	onBeforeRenderSubFolderFieldSet : function (fieldSet)
	{
		var searchFolderCombo = this.searchToolbar.getSearchFolderCombo();
		var folder = container.getHierarchyStore().getFolder(searchFolderCombo.getValue());
		fieldSet.hidden = !this.model.supportsSearchFolder(folder);
	},

	/**
	 * Event handler triggered when "Include sub folder" checkbox which belongs to
	 * {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel SearchToolBox}
	 *  was checked/un-checked. it will also update the "include_subfolder" property of
	 * {@link Ext.data.Record searchFolder} record of search folder combo box.
	 *
	 * @param {Ext.form.Checkbox} checkbox The checkbox which fired the event
	 * @param {Boolean} check True if the checkbox is currently checked
	 * @private
	 */
	onCheckIncludeSubFolder : function (checkBox, checked)
	{
		var searchFolderCombo = this.searchToolbar.getSearchFolderCombo();
		var record = searchFolderCombo.findRecord('value', searchFolderCombo.getValue());

		if (checked !== record.get('include_subfolder')) {
			record.set('include_subfolder', checked);
			record.commit();
			this.searchToolBox.afterUpdateRestriction();
		}
	},

	/**
	 * Event handle triggered when "Include sub folder" checkbox which belongs to
	 * {@link Zarafa.advancesearch.dialogs.SearchToolBoxPanel SearchToolBox} was rendered
	 * also it will call when search folder change in {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}.
	 * Also function is responsible to disable "Include sub folder" check box
	 * and apply the tooltip when "All folders" option in {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}
	 * is selected else enable checkbox and remove the tooltip from "Include Sub folder" checkbox.
	 *
	 * @param {Ext.form.Checkbox} checkBox The checkbox which was rendered.
	 */
	onRenderSubFolderCheckbox : function (checkBox)
	{
		var searchFolderCombo = this.searchToolbar.getSearchFolderCombo();
		var record = searchFolderCombo.findRecord('value', searchFolderCombo.getValue());
		var isAllFolderSelected = record.get('flag') === Zarafa.advancesearch.data.SearchComboBoxFieldsFlags.ALL_FOLDERS;
		checkBox.setDisabled(isAllFolderSelected);
		checkBox.setValue(record.get('include_subfolder'));

		if(checkBox.rendered) {
			// Add tooltip on "include sub folder" check box when "All folders"
			// was selected in search folder combo box else remove tooltip from
			// "include sub folder" check box
			if (isAllFolderSelected) {
				checkBox.wrap.dom.qtip = _("All folders are selected");
			} else {
				delete(checkBox.wrap.dom.qtip);
			}
		}
	},

	/**
	 * Event handler triggered before selection performs in {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}
	 * Will open {@link Zarafa.advancesearch.dialogs.SelectFolderContentPanel SelectFolderContentPanel}, if
	 * "Other.." option was selected. also it will check select folder from {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}
	 * is supports search folder if not we hide the {@link Ext.form.FieldSet IncludeSubFolderFieldSet}.
	 *
	 * @param {Zarafa.common.searchfield.ui.SearchFolderCombo} combo The combo which fired the event.
	 * @param {Ext.data.Record} record The data record returned from the underlying store
	 * @param {number} index The index of the selected item in the dropdown list
	 * @return {boolean} true if selected record is not 'Other...' else false.
	 */
	onBeforeSelectSearchFolder : function (combo, record, index)
	{
		if(record.get('value') === 'other') {
			combo.collapse();
			Zarafa.advancesearch.Actions.openSelectSearchFolderDialog({
				searchFolderCombo : combo,
				model : this.model
			});
			return false;
		} else {
			var folder = container.getHierarchyStore().getFolder(record.get('value'));
			this.searchToolBox.includeSubFolderFieldSet.setVisible(this.model.supportsSearchFolder(folder));
			this.doLayout();
		}
		return true;
	},

	/**
	 * Event handler triggered when Search result grid is gets resize.
	 * also it will set the width of the left and right toolbar of the
	 * {@link Zarafa.advancesearch.dialogs.SearchToolbarPanel search toolbar panel}
	 *
	 * @param {Ext.grid.GridPanel} grid which holds the search result.
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 */
	onSearchGridResize : function(grid, adjWidth, adjHeight, rawWidth, rawHeight )
	{
		var leftToolbar = this.searchToolbar.contextMainPanelToolbar;
		var rightToolbar = this.searchToolbar.getRightSearchToolbar();

		var searchToolBox = this.getLayout().west;
		var searchToolBoxMargins = searchToolBox.getMargins();

		var margins = searchToolBoxMargins.left + searchToolBoxMargins.right;

		leftToolbar.setWidth(searchToolBox.getSize().width + margins + adjWidth);

		rightToolbar.setWidth(this.centerRegion.switchBorder.getLayout().south.getSize().width);
		rightToolbar.setPosition(leftToolbar.getWidth());
	},

	/**
	 * Event handler which triggered when {@link Zarafa.advancesearch.ui.SearchResultPreviewPanel SearchResultPreviewPanel}
	 * was updated.
	 *
	 * @param {Zarafa.advancesearch.ui.SearchResultPreviewPanel} SearchResultPreviewPanel The SearchResultPreviewPanel which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 */
	onAfterUpdateSearchPreviewPanel : function(SearchResultPreviewPanel,record, contentReset)
	{
		var rightToolbar = this.searchToolbar.getRightSearchToolbar();
		rightToolbar.setVisible(!!record);

		if (record) {
			var isFaultyMessage = record.isFaultyMessage();
			var isMessageReplyable = Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.NOTE', 'REPORT.IPM', 'IPM.SCHEDULE', 'IPM.APPOINTMENT']);

			// Additional check when the message is IPM.Appointment and not a meeting request
			// but a simple appointment which can not be replied as there is no reply-to recipients available.
			if (isMessageReplyable && Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.APPOINTMENT'])) {
				if(!record.isMeeting()){
					isMessageReplyable = false;
				}
			}

			rightToolbar.replyBtn.setVisible(!isFaultyMessage && isMessageReplyable);
			rightToolbar.replyAllBtn.setVisible(!isFaultyMessage && isMessageReplyable);
			rightToolbar.forwardBtn.setVisible(!isFaultyMessage && isMessageReplyable);

			// Currently pop-out functionality is not available for
			// contact, sticky note, distribution list, appointment and task
			// So disable showing popout button in search results preview panel for those context item
			// TODO Remove when we support popout for all context
			if (Zarafa.supportsPopOut()) {
				var isSupportPopout = Zarafa.core.MessageClass.isClass(record.get('message_class'), ['IPM.NOTE', 'REPORT.IPM.Note', 'IPM.Schedule.Meeting'], true);
				rightToolbar.popoutBtn.setVisible(isSupportPopout);
			}

			// Only show the "Edit as New" button in the toolbar when the item is in the Sent folder
			var defaultFolder = SearchResultPreviewPanel.model.getDefaultFolder();
			rightToolbar.editAsNewBtn.setVisible(defaultFolder.getDefaultFolderKey() === 'sent' && !isFaultyMessage && isMessageReplyable);

			this.searchToolbar.recordComponentPlugin.setRecord(record);
		}
	}
});

Ext.reg('zarafa.searchpanel', Zarafa.advancesearch.dialogs.SearchPanel);
