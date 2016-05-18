Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.AppointmentSelectionModel
 * @extends Ext.grid.AbstractSelectionModel
 * 
 * The appointment selection model keeps a list of selected appointment records.
 * Used to share a common selection model across different calendar views.
 */
Zarafa.calendar.ui.AppointmentSelectionModel = Ext.extend(Ext.grid.AbstractSelectionModel, {
	/**
	 * @cfg {Boolean} singleSelect true to allow selection of only one row at a time (defaults to false allowing multiple selections)
	 */
	singleSelect : true,

	/**
	 * The array of selected record.
	 * @property
	 * @type Ext.util.MixedCollection
	 * @private
	 */
	selections : undefined,

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		this.selections = new Ext.util.MixedCollection(false, function(o) {
			var id = o.id;
			if (Ext.isDate(o.data.basedate)) {
				id += o.data.basedate.getTime();
			}
			return id;
		});

		this.addEvents(
			/**
			 * @event appointmentselect
			 * Fires when a record has been selected.
			 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} model this selection model.
			 * @param {Ext.data.Record} record The record which was selected.
			 */
			'appointmentselect',
			/**
			 * @event appointmentdeselect
			 * Fires when a record has been deselected.
			 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} model this selection model.
			 * @param {Ext.data.Record} record The record which was deselected.
			 */
			'appointmentdeselect',
			/**
			 * @event selectionclear
			 * Fires when the record selection has been cleared.
			 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} model this selection model.
			 */
			'selectionclear',
			/**
			 * @event selectionchange
			 * Fires when records have been added to or removed from the selection.
			 * @param {Zarafa.calendar.ui.AppointmentSelectionModel} model this selection model.
			 * @param {Ext.data.Record/Array} records currently selected appointment records.
			 */
			'selectionchange'
		);

		Zarafa.calendar.ui.AppointmentSelectionModel.superclass.constructor.call(this, config);
	},

	/**
	 * Clears all selections if the selection model {@link #isLocked is not locked}.
	 */
	clearSelections : function()
	{
		if (this.isLocked()) {
			return;
		}

		if (this.selections.getCount() === 0) {
			return;
		}

		this.selections.clear();

		this.fireEvent('selectionclear', this);
		this.fireEvent('selectionchange', this, this.getSelections());
	},

	/**
	 * Gets the number of selected appointments
	 * @return {Number} The number of selected appointments
	 */
	getCount : function()
	{
		return this.selections.getCount();
	},

	/**
	 * Returns the selected records
	 * @return {Array} Array of selected records
	 */
	getSelections : function()
	{
		return [].concat(this.selections.items);
	},

	/**
	 * Returns the first selected record.
	 * @return {Zarafa.core.data.IPMRecord}
	 */
	getSelected : function()
	{
		return this.selections.itemAt(0);
	},

	/**
	 * Returns <tt>true</tt> if there is a selection.
	 * @return {Boolean}
	 */
	hasSelection : function()
	{
		return this.selections.length > 0;
	},

	/**
	 * Returns <tt>true</tt> if the specified row is selected.
	 * @param {Record} record The record to check
	 * @return {Boolean}
	 */
	isSelected : function(record)
	{
		return (record && this.selections.key(this.selections.getKey(record)) ? true : false);
	},

	/**
	 * Selects a record. Before selecting a record, checks if the selection model
	 * {@link Ext.grid.AbstractSelectionModel#isLocked is locked}.
	 * If these checks are satisfied the record will be selected 
	 * and followed up by firing the {@link #selectionchange} events.
	 * @param {Zarafa.core.data.IPMRecord} record The record to select
	 * @param {Boolean} keepExisting (optional) <tt>true</tt> to keep existing selections
	 */
	selectRecord : function(record, keepExisting)
	{
		if (this.isLocked() || !Ext.isDefined(record) || (keepExisting && this.isSelected(record))) {
			return;
		}

		// disable selection of private appointments
		if(record.get('access') === 0) {
			return;
		}

		if (!keepExisting || this.singleSelect) {
			this.clearSelections();
		}

		this.selections.add(record);
		this.fireEvent('appointmentselect', this, record);
		this.fireEvent('selectionchange', this, this.getSelections());
	},

	/**
	 * Deselects a record. Before deselecting a row, checks if the selection model
	 * {@link Ext.grid.AbstractSelectionModel#isLocked is locked}.
	 * If this check is satisfied the row will be deselected and followed up by
	 * firing the {@link #selectionchange} event.
	 * @param {Number} row The index of the row to deselect
	 */
	deselectRecord : function(record)
	{
		if (this.isLocked() || !Ext.isDefined(record)) {
			return;
		}

		this.selections.remove(record);
		this.fireEvent('appointmentdeselect', this, record);
		this.fireEvent('selectionchange', this, this.getSelections());
	}
});
