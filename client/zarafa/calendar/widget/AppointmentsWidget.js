Ext.namespace('Zarafa.calendar.widget');

/**
 * @class Zarafa.calendar.widget.AppointmentsWidget
 * @extends Zarafa.core.ui.widget.AbstractFolderWidget
 *
 * Widget that displays the appointments for today, from the default
 * calendar.  It only displays appointments that occur on or after the
 * current time, so outdated information is never shown.
 *
 * Reload time is configurable per instance of the
 * widget (keys: 'reloadinterval', default 5 minutes).  These values are in
 * saved in miliseconds but displayed in seconds. The reload
 * interval is how often the calendar is fully reloaded from the
 * server, to show records that were added to the folder
 * outside of WebApp.
 */
Zarafa.calendar.widget.AppointmentsWidget = Ext.extend(Zarafa.core.ui.widget.AbstractFolderWidget, {
	/**
	 * The folder which was selected by the user
	 * @property
	 * @type Zarafa.hierarchy.data.MAPIFolderRecord
	 */
	folder: undefined,

	/**
	 * 'entryid' of folder which was selected by the user
	 * @property
	 * @type String
	 */
	folderId: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function (config)
	{
		config = config || {};

		var store = new Zarafa.calendar.AppointmentStore();

		Ext.applyIf(config, {
			autoScroll: true,
			layout: 'fit',
			folderType: 'calendar',
			store: store,
			items: [{
				xtype: 'zarafa.gridpanel',
				cls: 'k-appointmentwidget',
				store: store,
				hideHeaders: true,
				ref: 'appointmentsGrid',
				loadMask: {
					msg: _('Loading appointments...')
				},
				sm: new Zarafa.common.ui.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _("Please select a calendar via widget settings") + '</div>',
					forceFit: true,
					enableRowBody: true,
					rowSelectorDepth: 15,
					getRowClass: this.viewConfigGetRowClass,
					scope: this
				},
				colModel: new Ext.grid.ColumnModel({
					columns: [{
						header: _('Time'),
						dataIndex: 'startdate',
						renderer: this.timeRenderer,
						scope: this
					}]
				}),
				listeners: {
					'rowcontextmenu': this.onRowContextMenu,
					'rowdblclick': this.onRowDblClick,
					scope: this
				}
			}]
		});

		// Customize the configuration of the settings window
		this.configurationConfig = {
			height: 180
		};

		Zarafa.calendar.widget.AppointmentsWidget.superclass.constructor.call(this, config);
		this.folderId = this.get('folderId');
	},

	/**
	 * Adds a field to configure the number of days for which appointments will be shown
	 * @return {array} An array of configuration objects for {@link Ext.Component components}
	 */
	getConfigurationItems: function()
	{
		return [{
			xtype: 'zarafa.spinnerfield',
			fieldLabel: _('Number of days'),
			name: 'numdays',
			boxLabel: _('day(s)'),
			width: 60,
			minValue: 1, // 1 day
			maxValue: 365, // 1 year
			incrementValue: 1, // 1 day
			defaultValue: this.get('numdays') || 5,
			listeners: {
				'change': this.onNumDaysChange,
				scope: this
			},
			plugins: ['zarafa.numberspinner']
		},{
			xtype: 'zarafa.calendarfolderselectionlink',
			folder: this.folder,
			fieldLabel: _('Calendar'),
			name: 'Calendar',
			listeners: {
				'folderupdate': this.onUpdateFolder,
				scope: this
			}
		}];
	},

	/**
	 * Initialize the event handlers for the {@link #store} and {@link Zarafa.hierarchy.data.HierarchyStore HierarchyStore}.
	 * @protected
	 */
	initEvents: function () {
		Zarafa.calendar.widget.AppointmentsWidget.superclass.initEvents.apply(this, arguments);

		// set handlers to update widget state on remove of folder from hierarchy.
		var hierarchyStore = container.getHierarchyStore();
		this.mon(hierarchyStore, {
			'remove': this.onSharedStoreRemove,
			'removeFolder': this.onSharedStoreRemove,
			scope: this
		});

		// Wait for the store to be loaded, so we can activate
		// the filter task and set empty text if no appointments available.
		this.mon(this.store, 'load', this.onStoreLoad, this, { single: true });
		this.mon(this.store, 'exception', this.onStoreException, this);
	},

	/**
	 * Handler for {@link #store} for {@link Ext.data.Store#load load} event.
	 * This will call {@link #startFilterTask} and {@link #setEmptytext} after the {@link #store} load.
	 * @private
	 */
	onStoreLoad: function()
	{
		this.startFilterTask();
		this.setEmptytext();
	},

	/**
	 * Handler for {@link #store} for {@link Ext.data.Store#exception exception} event.
	 * This will remove all records from store and set empty text as error message received from php side.
	 *
	 * @param {Misc} misc See {@link Ext.data.DataProxy}#{@link Ext.data.DataProxy#exception exception}
	 * for description.
	 * @private
	 */
	onStoreException: function(proxy, type, action, options, response, args)
	{
		var emptyText;
		if (response && response.error) {
			var errObj = response.error;

			if (errObj.info && errObj.info.display_message) {
				emptyText = String.format(_("{0}"), errObj.info.display_message);
			}
		}

		// Empty store so that we can show error message.
		this.appointmentsGrid.getStore().removeAll();
		this.setEmptytext(emptyText);
	},

	/**
	 * Load the stored calendar folder and retrieve the records.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} hierarchyStore The store which fired the event
	 * @private
	 */
	onHierarchyLoad: function (hierarchyStore)
	{
		if (Ext.isEmpty(this.folderId)) {
			return;
		}

		this.folder = hierarchyStore.getFolder(this.folderId);
		var folderReadRight = Zarafa.core.mapi.Rights.RIGHTS_READ_ANY;
		if (Ext.isEmpty(this.folder) ||
			(this.folder.get('rights') & folderReadRight) !== folderReadRight) {
			// Reset when there is folderId and we can't find folder
			// or folder has not 'RIGHTS_FOLDER_VISIBLE' rights.
			// So, we need to reset the state.
			this.resetWidget();
			return;
		}

		this.setWidgetTitle(this.folder);
		this.reloadStore();
	},

	/**
	 * Reset when previously selected folder is not found (e.g. saved states will be cleared on reset settings of webapp).
	 * This will be called from {@link Zarafa.widgets.folderwidgets.AbstractFolderWidget#onHierarchyLoad onHierarchyLoad}
	 * when folder is not found and when the 'remove' or 'removeFolder' event fired for hierarchy store.
	 */
	resetWidget: function()
	{
		this.folder = undefined;
		this.folderId = undefined;
		this.set("folderId", undefined);
		this.appointmentsGrid.getStore().removeAll();
	},

	/**
	 * This method will set name of this widget.
	 * If folder is not given, it will set default title otherwise it will prepare
	 * title for widget as per folder given and apply it.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder which is selected to show appointments from.
	 * @private
	 */
	setWidgetTitle: function(folder)
	{
		var title = _('Upcoming Appointments');

		if (folder) {
			var folderStore = folder.getMAPIStore();
			var isOwnStore = folderStore.isDefaultStore();
			var isDefaultFolder = folder.isDefaultFolder();

			var ownerName = folderStore.get('display_name');
			var folderName = folder.get('display_name');

			// Do not show ownername for own store folder.
			// And don't change title for default calendar folder of own store.
			if (!(isOwnStore && isDefaultFolder)) {
				if (isOwnStore) {
					title = String.format(_('Appointments of {0}'), folderName);
				} else {
					title = String.format(_('Appointments of {0} - {1}'), folderName, ownerName);
				}
			}
		}

		this.setTitle(title);
	},

	/**
	 * This method will set empty text message of this widget.
	 * If the emptyText param is not provided then it will set 'No appointments' message
	 * when no appointments are available.
	 * Or if {@link #folder} has no value (no folder is selected currently) then
	 * this will display a message to select folder.
	 *
	 * @param {String} emptyText which needs to be set as empty text of grid view.
	 */
	setEmptytext: function(emptyText)
	{
		var gridView = this.appointmentsGrid.getView();

		if (Ext.isEmpty(emptyText)) {
			emptyText = this.folder ? _('No appointments') : _("Please select a calendar via widget settings");
		}

		gridView.emptyText = '<div class="emptytext">'+ emptyText +'</div>';
		gridView.refresh();
	},

	/**
	 * Event handler for 'remove' and 'removeFolder' events of {@link Zarafa.hierarchy.data.HierarchyStore Hierarchy}
	 * This will reset widget if state folder of this widget gets deleted.
	 *
	 * @param {Zarafa.hierarchy.data.HierarchyStore} store hierarchy store after removing record.
	 * @param {Zarafa.hierarchy.data.MAPIStoreRecord} record The record which is removed
	 * @param {Number} totalRecords total number of records in store.
	 */
	onSharedStoreRemove: function(store, record, totalRecords)
	{
		var stateFolderId = this.get('folderId');
		if (!Ext.isEmpty(stateFolderId)) {
			var stateFolder = store.getFolder(stateFolderId);

			// If deleted folder is state folder or closed shared store includes
			// state folder then reset this widget.
			if (Ext.isEmpty(stateFolder)) {
				this.resetWidget();
				this.setEmptytext();
			}
		}
	},

	/**
	 * Event handler for 'folderupdate' event.
	 * This will update the {@link #folder} , save the folder entryid in state,
	 * set title of this widget and reload the state with updated folder.
	 *
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder folder which is selected to show appointments from.
	 * @private
	 */
	onUpdateFolder: function (folder)
	{
		this.folder = folder;
		this.folderId = folder.get('entryid');
		this.set("folderId", this.folderId);
		this.setWidgetTitle(folder);
		this.reloadStore();
		this.setEmptytext();
	},

	/**
	 * Event handler which is fired when 'Number of Days' field in the Configuration dialog
	 * has been changed. This will update the corresponding option in the settings.
	 * @param {Ext.form.Field} field The field which fired the event
	 * @param {Mixed} newValue The new value which was applied
	 * @param {Mixed} oldValue The old value which was applied
	 * @private
	 */
	onNumDaysChange: function (field, newValue, oldValue)
	{
		this.set(field.getName(), newValue);
		this.reloadStore();
	},

	/**
	* Starts a filter task for the store. Will make sure that the filter is updated at
	* every 30 seconds so old appointments will be filtered out.
	* @private
	*/
	startFilterTask: function ()
	{
		Ext.TaskMgr.start({
			run: this.updateFilter,
			interval: 30000,
			scope: this
		});
	},

	/**
	 * This will {@link Ext.data.Store#load load} the {@link #store} using
	 * a restriction which only allows todays appointments.
	 * @private
	 */
	reloadStore: function ()
	{
		if (!this.folder) {
			return;
		}

		var numDays = this.get('numdays') || 5;

		var startdate = new Date().clearTime().getTime() / 1000;
		var duedate = new Date().clearTime().add(Date.DAY, numDays).getTime() / 1000;

		this.store.load({
			folder: this.folder,
			params: {
				suppress_exception: true,
				restriction: {
					startdate: startdate,
					duedate: duedate
				}
			}
		});
	},

	/**
	 * Update the filter with the current time. Items that end
	 * before now are removed.
	 * @private
	 */
	updateFilter: function ()
	{
		var now = new Date().getTime() / 1000;
		this.store.filterBy(function (record) {
			var dueDate = record.get('duedate').getTime() / 1000;
			return !dueDate || dueDate >= now;
		}, this);
	},

	/**
	 * Renderer for the time column. Adds a recurrence icon and a private icon if applicable
	 *
	 * @param {Mixed} value The subject of the appointment
	 * @param {Object} metaData Used to set style information to gray out appointments that occur now
	 * @param {Ext.data.Record} record The record being displayed, used to retrieve the start and end times
	 * @private
	 */
	timeRenderer: function (value, metaData, record)
	{
		var recurringIcon = '';
		var recurringPattern = record.get('recurring_pattern');
		if (recurringPattern) {
			if (record.get('exception') === true) {
				recurringIcon =
					'&nbsp;<span ext:qwidth="300" ext:qtip="' + recurringPattern + '">' +
						'<img src="' + Zarafa.calendar.ui.IconCache.getExceptionIcon().src + '"/>' +
					'</span>';
			} else {
				recurringIcon =
					'&nbsp;<span ext:qwidth="300" ext:qtip="' + recurringPattern + '">' +
						'<img src="' + Zarafa.calendar.ui.IconCache.getRecurringIcon().src + '"/>' +
					'</span>';
			}
		}

		var privateIcon = '';
		if (record.get('private') === true) {
			privateIcon = '&nbsp;<img src="' + Zarafa.calendar.ui.IconCache.getPrivateIcon().src + '"/>';
		}

		var dayStart = new Date().clearTime();
		var dayEnd = new Date().add(Date.DAY, 1).clearTime();
		var start = value;
		var end = record.get('duedate');
		var allDayEvent = record.get('alldayevent');

		if ( start >= dayStart && end <= dayEnd ) {
			if ( !allDayEvent ) {
				return String.format(_('Today {0} - {1}'), start.formatDefaultTime(), end.formatDefaultTime()) + recurringIcon + privateIcon;
			}

			return _('Today (all day)') + recurringIcon + privateIcon;
		}

		if ( !allDayEvent ) {
			return String.format(_('{0} - {1}'), start.formatDefaultTime(_('d/m/y {0}')), end.formatDefaultTime(_('d/m/y {0}'))) + recurringIcon + privateIcon;
		}

		return String.format(_('{0} - {1} (all day)'), start.format(_('d/m/y')), end.format(_('d/m/y'))) + recurringIcon + privateIcon;
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex index of row
	 * @param {Ext.EventObject} event event object of the event
	 * @private
	 */
	onRowContextMenu: function (grid, rowIndex, event)
	{
		// check row is already selected or not, if its not selected then select it first
		var selectionModel = grid.getSelectionModel();
		if (!selectionModel.isSelected(rowIndex)) {
			selectionModel.selectRow(rowIndex);
		}

		// The ContextMenu needs the ContextModel for cases where we want to reply the mail.
		var model;
		if (this.folder) {
			var context = container.getContextByFolder(this.folder);
			if (context) {
				model = context.getModel();
				Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), {
					position: event.getXY(),
					model: model
				});
			}
		}
	},

	/**
	 * Called when the user double-clicks on an appointment.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The row which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onRowDblClick: function (grid, rowIndex, event)
	{
		var record = grid.getSelectionModel().getSelected();
		if (!Ext.isEmpty(record)) {
			// FIXME what about recurring series records ?
			if (record.isRecurringOccurence()) {
				record = record.convertToOccurenceRecord();
			}
		}
		Zarafa.core.data.UIFactory.openViewRecord(record);
	}
});

Zarafa.onReady(function () {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name: 'appointments',
		iconCls: "icon_widget_calendar",
		displayName: _('Upcoming Appointments'),
		widgetConstructor: Zarafa.calendar.widget.AppointmentsWidget
	}));
});
