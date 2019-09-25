(function() {
	var orig_getValue = Ext.form.DateField.prototype.getValue;
	var orig_initComponent = Ext.form.DateField.prototype.initComponent;
	var orig_onTriggerClick = Ext.form.DateField.prototype.onTriggerClick;
	var orig_menuEvents = Ext.form.DateField.prototype.menuEvents;
	Ext.override(Ext.form.DateField, {
		/**
		 * @cfg {Boolean} showNow True to enable the mechanism which convert 'Today' button into 'Now'
		 * and fire {@link #selectnow} event while 'Now' button will be pressed, false otherwise.
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

			orig_initComponent.apply(this, arguments);

			this.addEvents(
				/**
				 * @event selectnow
				 * Fires when 'Today' button is pressed from the date picker only if {@link #showNow} is configured as true.
				 * @param {Ext.form.DateField} this
				 * @param {Date} date The date that was selected
				 */
				'selectnow'
			);

			// Check for invalid start day
			if(this.startDay < 0 || this.startDay >= Date.dayNames.length) {
				// by default make it sunday
				this.startDay = 0;
			}
		},

		/*
		 * Fix the getValue function for the DateField, normally Extjs would
		 * return an empty string ("") when no date was provided, but it more
		 * logically would be to return null.
		 */
		getValue : function()
		{
			var value = orig_getValue.apply(this, arguments);
			return Ext.isEmpty(value) ? null : value;
		},

		/**
		* This function prepares raw values for validation purpose only. Here when
		* field value is null than empty string will be returned because ExtJS by default uses
		* empty string to indicate that date is not present but there is no way in mapi to set
		* empty date. Here the validation function for date field doesn't expect null so we have
		* overriden processValue to give empty string if value is null.
		* @param {Mixed} value
		* @return {Mixed} value or empty string.
		*/
		processValue : function(value)
		{
			return Ext.isEmpty(value) ? "" : value;
		},

		/**
		 * Overridden to add possibilities to get an event fired when 'Today' button will be clicked.
		 * and rename the button from 'Today' to 'Now'.
		 * @override
		 */
		onTriggerClick : function()
		{
			if(this.showNow && this.menu == null) {
				this.menu = new Ext.menu.DateMenu({
					hideOnClick: false,
					focusOnSelect: false,
					initialConfig : {
						showNow : true,
						todayText : _("Now")
					}
				});
			}

			orig_onTriggerClick.apply(this, arguments);

			if(this.showNow) {
				 /**
				 * @event selectnow
				 * Fires when 'Now' button is clicked from the {@link Ext.DatePicker}
				 * @param {DatePicker} picker The {@link Ext.DatePicker}
				 * @param {Date} date The selected date
				 */
				this.menu.relayEvents(this.menu.picker, ['selectnow']);
			}
		},

		/**
		 * Overridden to register/deregister 'selectnow' event.
		 * This is a helper function to dynamically achieve registration and deregistration of any event by single function.
		 * @param {String} method Name of method like 'on' or 'un'.
		 * @private
		 * @override
		 */
		menuEvents: function(method){

			orig_menuEvents.apply(this, arguments);

			if(this.showNow) {
				this.menu[method]('selectnow', this.onSelectnow, this);
			}
		},

		/**
		 * Handler for the 'selectnow' event of {@link #menu}.
		 * Overridden to relay/fire 'selectnow' event for {@link #this}.
		 * @param {DatePicker} picker The {@link #picker Ext.DatePicker}
		 * @param {Date} date The selected date
		 * @private
		 * @override
		 */
		onSelectnow : function(picker,date){
			this.fireEvent('selectnow', this, date);
		}
	});
})();
