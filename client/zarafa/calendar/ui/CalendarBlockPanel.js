Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.CalendarBlockPanel
 * @extends Ext.Panel
 * @xtype zarafa.calendarblockpanel
 * The main panel for the calendar content context.
 */
Zarafa.calendar.ui.CalendarBlockPanel = Ext.extend(Ext.Panel, {
    /**
	 * @cfg {Zarafa.calendar.CalendarContext} context The context to which this panel belongs
	 */
	context : undefined,

	/**
	 * The {@link Zarafa.calendar.CalendarContextModel} which is obtained from
	 * the {@link #context}.
	 *
	 * @property
	 * @type Zarafa.calendar.CalendarContextModel
	 */
	model : undefined,

	/**
	 * @cfg {Zarafa.calendar.ui.AppointmentSelectionModel} selectionModel The
	 * selection model which can be used for selecting {@link Zarafa.core.data.IPMRecord records}.
	 */
	selectionModel : undefined,

	/**
	 * @cfg {Zarafa.calendar.ui.DateRangeSelectionModel} rangeSelectionModel The
	 * selection model which can be used for selecting a {@link Zarafa.core.DateRange daterange}
	 * within the calendar.
	 */
	rangeSelectionModel : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}
		if (!Ext.isDefined(config.selectionModel)) {
			config.selectionModel = new Zarafa.calendar.ui.AppointmentSelectionModel();
		}
		if (!Ext.isDefined(config.rangeSelectionModel)) {
			config.rangeSelectionModel = new Zarafa.calendar.ui.DateRangeSelectionModel();
		}

		Ext.applyIf(config, {
			border : false,
			layout : 'fit',
			deferredRender : false,
			items : [{
				xtype: 'zarafa.calendarpanel',
				ref: 'calendarPanel',
				context : config.context,
				selectionModel : config.selectionModel,
				rangeSelectionModel : config.rangeSelectionModel,
				listeners : {
					scope : this,
					contextmenu : this.onContextMenu,
					dblclick : this.onDblClick,
					dayclick : this.onDayClick,
					calendarclose : this.onCalendarClose
				}
			}]
		});

		Zarafa.calendar.ui.CalendarBlockPanel.superclass.constructor.call(this, config);

		// Add hook for updating the ContextModel on Appointment Selections
		this.mon(this.selectionModel, 'selectionchange', this.onSelectionChange, this);

		// Register remove event on store so that when some record is removed from
		// the store we remove it from the selection as well.
		var store = config.model.getStore();
		if(store){
			this.mon(store, 'remove', this.onStoreRemove, this);
		}
	},

	/**
	 * Function is called when record is removed from the store. It will remove
	 * record from {@link #selectionModel} which are removed from the store.
	 *
	 * @param {Zarafa.calendar.AppointmentStore} store
	 * @param {Ext.data.Record} record The Record that was removed
	 * @param {Number} index The index at which the record was removed
	 *
	 * @private
	 */
	onStoreRemove : function(store, record, index)
	{
		this.selectionModel.deselectRecord(record);
	},

	/**
	 * Obtain a reference to the {@link Zarafa.calendar.ui.CalendarPanel CalendarPanel}
	 * which renderering within this CalendarBlockPanel.
	 * @return {Zarafa.calendar.ui.CalendarPanel} The calendar panel.
	 */
	getCalendarPanel : function()
	{
		return this.calendarPanel;
	},

	/**
	 * Event handler which is fired when the user requests the contextmenu on this panel.
	 * @param {Object} event The event object
	 * @param {Zarafa.core.data.IPMRecord} record The record for which the contextmenu is requested
	 * @private
	 */
	onContextMenu : function(event, record)
	{
		Zarafa.core.data.UIFactory.openDefaultContextMenu(record, { position : event.getXY() });
	},

	/**
	 * Event handler which is fired when the user doubleclicks on the panel. This will open the
	 * selected record in a {@link Zarafa.calendar.dialogs.AppointmentContentPanel AppointmentContentPanel}.
	 * @param {Object} event The event object
	 * @param {Zarafa.core.data.IPMRecord} record The record which was double-clicked
	 * @private
	 */
	onDblClick : function(event, record)
	{
		Zarafa.calendar.Actions.openAppointmentContent(record);
	},

	/**
	 * Event handler which is triggered when the {@link Zarafa.mail.ui.MailGrid grid}
	 * {@link Zarafa.core.data.IPMRecord record} selection is changed. This will inform
	 * the {@link Zarafa.mail.MailContextModel contextmodel} about the change.
	 *
	 * @param {Ext.grid.RowSelectionModel} selectionModel The selection model used by the grid.
	 * @private
	 */
	onSelectionChange : function(selectionModel)
	{
		this.model.setSelectedRecords(selectionModel.getSelections());
	},

	/**
	 * Event handler which is fired when the user clicks on the Day header. This will change
	 * the {@link Zarafa.calendar.data.Views views} to {@link Zarafa.calendar.data.Views#BLOCKS},
	 * the {@link Zarafa.calendar.data.ViewModes ViewMode} to {@link Zarafa.calendar.data.ViewModes#DAYS},
	 * and the {@link Zarafa.calendar.data.DataModes DataMode} to {@link Zarafa.calendar.data.DataModes#DAY}.
	 * and moves to the selected day.
	 * @param {Object} source The object which fired the event
	 * @param {Date} date The date which was selected
	 * @private
	 */
	onDayClick : function(source, date)
	{
		this.selectionModel.clearSelections();
		this.rangeSelectionModel.clearSelections();

		this.context.switchView(Zarafa.calendar.data.Views.BLOCKS, Zarafa.calendar.data.ViewModes.DAYS);
		this.model.setModeAndDate(Zarafa.calendar.data.DataModes.DAY, date);
	},

	/**
	 * Event handler which is fired when the user closes one of the CalendarTabs. This will
	 * remove the selected folder from the {@link Zarafa.calendar.CalendarContextModel ContextModel}.
	 * @param {Zarafa.hierarchy.data.MAPIFolderRecord} folder The selected folder
	 * @private
	 */
	onCalendarClose : function(folder)
	{
		this.model.removeFolder(folder);
	},

	/**
	 * Called automatically by the superclass when this panel is being added to a container.
	 * This will add an {@link Zarafa.calendar.ui.CalendarMainPanel#switchview switchview}
	 * event handler for listening to view switches.
	 * @param {Ext.Container} container The contained on which this panel is added
	 * @param {Number} index The position of this panel within the container
	 * @private
	 */
	onAdded : function(container, index)
	{
		Zarafa.calendar.ui.CalendarBlockPanel.superclass.onAdded.call(this, container, index);
		this.mon(this.ownerCt, 'switchview', this.onSwitchView, this);
	},

	/**
	 * Called automatically by the superclass when this panel is being removed from a container.
	 * This will remove the {@link Zarafa.calendar.ui.CalendarMainPanel#switchview switchview}
	 * event handler.
	 * @private
	 */
	onRemoved : function()
	{
		this.mun(this.ownerCt, 'switchview', this.onSwitchView, this);
		Zarafa.calendar.ui.CalendarBlockPanel.superclass.onRemoved.call(this);
	},

	/**
	 * Event handler which is fired when the container is switching the main view.
	 * @param {Ext.Container} container The container which fired the event
	 * @param {Ext.Panel} newView The new view which has been loaded
	 * @param {Ext.Panel} oldView The old view which has been loaded
	 * @private
	 */
	onSwitchView : function(container, newView, oldView)
	{
		if (this == newView) {
			this.getCalendarPanel().bindStore(this.model.getStore());
		} else if (this == oldView) {
			this.getCalendarPanel().releaseStore(this.model.getStore());
		}
	}
});

Ext.reg('zarafa.calendarblockpanel', Zarafa.calendar.ui.CalendarBlockPanel);
