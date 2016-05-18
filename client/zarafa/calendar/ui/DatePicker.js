Ext.namespace('Zarafa.calendar.ui');
/**
* @class Zarafa.calendar.ui.DatePicker
* @extends Ext.DatePicker
* @xtype zarafa.datepicker
* This overriden DatePicker takes the default calendar folder of the user, and displays days in which there are appointments differently.
* Currently the x-date-busy CSS class is applied to these days.
*/
Zarafa.calendar.ui.DatePicker = Ext.extend(Ext.DatePicker, {
	/**
	 * A {@link Zarafa.calendar.data.busytime.BusyTimeStore} store used for keeping appointments (containing only time and busy status)
	 * @property
	 * @type Zarafa.calendar.data.busytime.BusyTimeStore
	 * @private
	 */
	store: undefined,

	/**
	 * Beginning of the current month
	 * @property
	 * @type Date
	 * @private
	 */
	monthStart: undefined,

	/**
	 * End of the current month
	 * @property
	 * @type Date
	 * @private
	 */
	monthEnd: undefined,

	/**
	 * constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};
		if(!config.store){
			config.store = new Zarafa.calendar.data.busytime.BusyTimeStore();
		}
		Zarafa.calendar.ui.DatePicker.superclass.constructor.call(this, config);

		// When the component is destroyed, we have to destroy the store
		this.on('destroy', this.store.destroy, this.store);
	},

	/**
	 * function called after the component has been rendered (right before the 'afterrender' event has fired)
	 * calls {@link #reloadStore}, which loads data from the store
	 * @private
	 */
	afterRender: function()
	{
		Zarafa.calendar.ui.DatePicker.superclass.afterRender.call(this);

		//attach event handlers
		//when store has finished loading, apply data from newly loaded appointments
		this.mon(this.store, 'load', this.onLoad, this);
	},

	/**
	 * used as a handler for the 'load' event. Invoked when the store has finished loading.
	 * @param {Zarafa.calendar.data.busytime.BusyTimeStore} store The store bound to this datepicker
	 * @param {Ext.data.Record[]} records an array of records loaded
	 * @param {Object} options The loading options specified
	 * @private
	 */
	onLoad: function(store, records, options)
	{
		this.clearCells();
		if (!this.settingIsSet()) {
			return false;
		}

		for (var i = 0, len = this.cells.elements.length; i < len; i++) {
			var cell = Ext.get(this.cells.elements[i]);
			var pickerDate = cell.dom.firstChild.dateValue;
			var foundAppt = false;

			for(var j = 0, len2 = records.length; j < len2; j++){
				var record = records[j];
				var storeDate = record.get('startdate').clearTime(true).getTime();
				if(pickerDate == storeDate && record.get('busystatus') != Zarafa.core.mapi.BusyStatus['FREE']){
					foundAppt=true;
					break;
				}
			}
			if (foundAppt) {
				cell.addClass('x-date-busy');
			} else {
				cell.removeClass('x-date-busy');
			}
		}
	},

	/**
	 * Event handler which is called when the component is made visible
	 * @private
	 */
	onShow : function()
	{
		this.reloadStore(this.cells.first().dom.firstChild.dateValue, this.cells.last().dom.firstChild.dateValue);
		Zarafa.calendar.ui.DatePicker.superclass.onShow.apply(this, arguments);
	},

	/**
	 * Event handler which is called when the component is hidden
	 * @private
	 */
	onHide : function()
	{
		this.store.cancelLoadRequests();
		Zarafa.calendar.ui.DatePicker.superclass.onHide.apply(this, arguments);
	},

	/**
	 * reload the store with date restrictions taken from the first and last cells of the table
	 * @param {Number} startDate beginning date for range in milliseconds
	 * @param {Number} dueDate final date for range in milliseconds
	 * @private
	 */
	reloadStore: function(startDate, dueDate)
	{
		var folder = container.getHierarchyStore().getDefaultFolder('calendar');
		if (folder) {
			this.monthStart = this.value.clone();
			this.monthStart.setDate(1);
			this.monthEnd = this.monthStart.add(Date.MONTH, 1);

			this.store.load({
				actionType: Zarafa.core.Actions['list'],
				params: {
					entryid : folder.get('entryid'),
					store_entryid : folder.get('store_entryid'),
					restriction : {
						startdate: startDate / 1000,
						duedate: dueDate / 1000
					}
				}
			});
		}
	},

	/**
	 * update function called when date has been changed (by clicking on date, through month picker, etc.)
	 * @param {Date} date The newly selected date
	 * @param {Boolean} forceRefresh
	 * @private
	 * @override
	 */
	update: function(date, forceRefresh)
	{
		Zarafa.calendar.ui.DatePicker.superclass.update.call(this, date, forceRefresh);
		if (!this.hidden && this.dateIsChanged(date)) {
			this.reloadStore(this.cells.first().dom.firstChild.dateValue, this.cells.last().dom.firstChild.dateValue);
		}
	},

	/**
	 * check if the passed date is in a different month or year than the current date
	 * @param {Date} date
	 * @return {Boolean}
	 * @private
	 */
	dateIsChanged: function(date)
	{
		var time = date.getTime();
		return (!this.monthStart || !this.monthEnd || time < this.monthStart.getTime() || this.monthEnd.getTime() <= time);
	},

	/**
	 * check whether setting for bolding days with appointments is set
	 * @return {Boolean}
	 * @private
	 */
	settingIsSet: function()
	{
		return container.getSettingsModel().get('zarafa/v1/contexts/calendar/datepicker_show_busy');
	},

	/**
	 * remove highlighting class from all cells
	 * @private
	 */
	clearCells: function()
	{
		this.cells.each(function(c){
			c.removeClass('x-date-busy');
		});
	}
});

Ext.reg('zarafa.datepicker', Zarafa.calendar.ui.DatePicker);
