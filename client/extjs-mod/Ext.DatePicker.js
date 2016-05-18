(function() {
	/**
	 * @class Ext.DatePicker
	 * @extends Ext.Component
	 * <p>A popup date picker. This class is used by the {@link Ext.form.DateField DateField} class
	 * to allow browsing and selection of valid dates.</p>
	 * <p>All the string values documented below may be overridden by including an Ext locale file in
	 * your page.</p>
	 * @constructor
	 * Create a new DatePicker
	 * @param {Object} config The config object
	 * @xtype datepicker
	 */
	var orig_onRender = Ext.DatePicker.prototype.onRender;
	var orig_update = Ext.DatePicker.prototype.update;
	var orig_beforeDestroy = Ext.DatePicker.prototype.beforeDestroy;
	var orig_initComponent = Ext.DatePicker.prototype.initComponent;
	var orig_selectToday = Ext.DatePicker.prototype.selectToday;
	Ext.override(Ext.DatePicker, {
		/**
		 * @cfg {number} width width of the datepicker (defaults to auto)
		 */
		width: '180',

		/**
		 * True to show week numbers, false otherwise.
		 * defaults to false.
		 * @cfg {Boolean} showWeekNumber
		 */
		showWeekNumber: false,

		/**
		 * Contains a collection DOM elements for week number.
		 * @property
		 * @type Ext.CompositeElementLite
		 */
		weekCells : undefined,

		/**
		 * @cfg {Boolean} showNow True to enable the mechanism which convert 'Today' button into 'Now'
		 * and fire {@link #selectnow} event while 'Now' button will be pressed along with the
		 * original functionality, false otherwise.
		 * defaults to false.
		 */
		showNow : false,

		/**
		 * overriden to set starting day of the week
		 * @override
		 */
		initComponent: function()
		{
			// if startDay is not specified through config then use one specified in settings
			if(!this.initialConfig.startDay) {
				this.startDay = container.getSettingsModel().get('zarafa/v1/main/week_start');
			}

			// Check for invalid start day
			if(this.startDay < 0 || this.startDay >= Date.dayNames.length) {
				// by default make it sunday
				this.startDay = 0;
			}

			orig_initComponent.apply(this, arguments);
		},

		/**
		 * handler for the render event
		 * overriden to set the width of the table
		 * @private
		 * @override
		 */
		onRender: function()
		{
			orig_onRender.apply(this, arguments);

			var table = this.getEl().down('table');
			table.applyStyles({ 'width' : this.width });
		},

		/**
		 * update function called when date has been changed (by clicking on date, through month picker, etc.)
		 * Additionally, an extra column will be created to display week number, if {@link #showWeekNumber} is configured as true.
		 * @param {Date} date The newly selected date
		 * @param {Boolean} forceRefresh
		 * @private
		 * @override
		 */
		update: function(date, forceRefresh)
		{
			// Check if week-number column will be shown or not.
			// Also check if week number column is already created.
			if(this.showWeekNumber === true && !Ext.isDefined(this.weekCells)) {
				// Get the table element of date-picker.
				var datePickerTable = this.el.child('table.x-date-inner', true);

				// Dynamically create week-number header.
				var tblHeadObj = datePickerTable.tHead;
				var headerRow = tblHeadObj.rows[0];
				var headerElement = {
					tag : 'th',
					/* # TRANSLATORS: This message is used as label for the column which indicates the week number of the month in date picker. and 'Wk' stands for week */
					html : '<span>' + _('Wk') + '</span>'
				};
				// Insert an extra table header at first position.
				Ext.DomHelper.insertFirst(headerRow, headerElement);

				// Dynamically create week-number cell in all rows.
				var tblBodyObj = datePickerTable.tBodies[0];
				var rowElement = {
					tag : 'td',
					cls : 'x-date-weeknumber',
					html : '<a><em><span></span></em></a>'
				};
				// Insert an extra cell at first position of all table rows.
				for (var i=0; i<tblBodyObj.rows.length; i++) {
					Ext.DomHelper.insertFirst(tblBodyObj.rows[i], rowElement);
				}

				this.weekCells = this.el.select('td.x-date-weeknumber a em span');
			}

			orig_update.apply(this, arguments);

			// Check if week-number column will be shown or not.
			if(this.showWeekNumber === true) {
				// Set week-number values into the dom elements respectively.
				var weekCells = this.weekCells.elements;
				var monthStartDate = date.getFirstDateOfMonth();

				for(var index = 0, len = weekCells.length; index < len; index++) {
					weekCells[index].innerHTML = monthStartDate.getWeekOfYear();
					monthStartDate = monthStartDate.add(Date.DAY, 7);
				}
			}
		},

		/**
		 * Handler for the before destroy event
		 * overriden to delete the {@link Ext.DatePicker#weekCells} property.
		 * @private
		 * @override
		 */
		beforeDestroy : function()
		{
			orig_beforeDestroy.apply(this, arguments);
			if(this.rendered && Ext.isDefined(this.weekCells)) {
				Ext.destroy(
					this.weekCells.el
				);

				delete this.weekCells;
			}
		},

		/**
		 * Overriden to fire 'selectnow' event if {@link #showNow} is set to true.
		 * @override
		 */
		selectToday : function()
		{
			if(this.showNow) {
				this.fireEvent('selectnow', this, this.value);
			}

			orig_selectToday.apply(this, arguments);
		}
	});
})();
