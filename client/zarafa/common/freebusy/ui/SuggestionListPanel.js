Ext.namespace('Zarafa.common.freebusy.ui');

/**
 * @class Zarafa.common.freebusy.ui.SuggestionListPanel
 * @extends Ext.Panel
 * @xtype zarafa.freebusysuggestionlistpanel
 *
 * The SuggestionList shows the list of suggested times
 * at which an appointment can be held.
 */
Zarafa.common.freebusy.ui.SuggestionListPanel = Ext.extend(Ext.Panel, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			border: false,
			items: [{
				xtype: 'panel',
				border: true,
				autoHeight: true,
				items: [{
					xtype: 'container',
					border : false,
					height : 168,
					width: 175,
					layout : 'fit',
					items : [{
						xtype: 'datepicker',
						ref: '../../suggestionDate',
						showToday : false,
						minDate : config.model ? config.model.getDateRange().getStartDate() : null,
						minText: _('No freebusy information available for this date'),
						maxDate : config.model ? config.model.getDateRange().getDueDate() : null,
						maxText: _('No freebusy information available for this date'),
						style : 'border : none',
						listeners: {
							select: this.onDateSelect,
							scope: this
						}
					}]
				}]
			},{
				xtype: 'panel',
				flex: 1,
				layout: 'fit',
				cls: 'suggestionlist',
				border: false,
				items: [{
					xtype: 'zarafa.freebusysuggestionlistview',
					autoScroll: true,
					model: config.model,
					listeners: {
						click: this.onSuggestionClick,
						scope: this
					}
				}]
			}]
		});
		
		this.addEvents([
			/**
			 * @event dateselect
			 * This event is fired when a date is selected from the datepicker.
			 * @param {Zarafa.common.freebusy.ui.SuggestionListPanel} this This panel
			 * @param {Date} date The selected date
			 */
			'dateselect',
			/**
			 * @event select
			 * This event is fired when a suggestion has been selected from the
			 * main {@link Zarafa.common.freebusy.ui.FreebusySuggestionListView FreebusySuggestionListView}
			 * @param {Zarafa.common.freebusy.ui.SuggestionListPanel} this This panel
			 * @param {Zarafa.common.freebusy.data.FreebusyBlockRecord} record The record containing the suggestion which was selected
			 */
			'select'
		]);

		Zarafa.common.freebusy.ui.SuggestionListPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize events
	 * @private
	 */
	initEvents: function()
	{
		Zarafa.common.freebusy.ui.SuggestionListPanel.superclass.initEvents.call(this);

		this.mon(this.model.getDateRange(), 'update', this.onDateRangeUpdate, this);
		this.mon(this.model.getSuggestionRange(), 'update', this.onSuggestionRangeUpdate, this);
	},

	/**
	 * Event handler which is raised when a suggestion from the {@link Ext.DataView DataView} has been
	 * clicked. This will search for the corresponding record and raise the {@link #selected} event.
	 * @param {Ext.DataView} view The DataView which raised the event
	 * @param {Number} index The index of the item which was clicked
	 * @param {HTMLElement} el The HTML element which was clicked
	 * @param {Object} event The event object
	 * @private
	 */
	onSuggestionClick : function(view, index, el, event)
	{
		var record = view.getStore().getAt(index);
		this.fireEvent('select', this, record);
	},

	/**
	 * Event handler which is raised when a date has been selected from the {@link Ext.DatePicker DatePicker}.
	 * This will update the suggestionlist to show the suggestions for the given {@link Ext.Date date}. It 
	 * will also fire the {@link #dateselect} event.
	 * @param {Ext.DatePicker} datepicker The datepicker object which raised the event
	 * @param {Ext.Date} date The selected date
	 * @private
	 */
	onDateSelect : function(datepicker, date)
	{
		this.model.setSuggestionDate(date);

		this.fireEvent('dateselect', this, date);
	},

	/**
	 * Event handler which is raised when the daterange of the freebusy has been updated,
	 * this will update the minValue/maxValue of the {@link Ext.DatePicker DatePicker}
	 * accordingly.
	 * @param {Zarafa.core.DateRange} newRange The new DateRange
	 * @param {Zarafa.core.DateRange} oldRange The old DateRange
	 * @private
	 */
	onDateRangeUpdate : function(newRange, oldRange)
	{
		this.suggestionDate.setMinDate(newRange.getStartDate());
		this.suggestionDate.setmaxDate(newRange.getDueDate());
	},

	/**
	 * Event handler which is raised when the suggestion daterange has been updated, this will
	 * update the {@link Ext.DatePicker DatePicker} to display the new value.
	 * @param {Zarafa.core.DateRange} newRange The new DateRange
	 * @param {Zarafa.core.DateRange} oldRange The old DateRange
	 * @private
	 */
	onSuggestionRangeUpdate : function(newRange, oldRange)
	{
		this.suggestionDate.setValue(newRange.getStartDate());
	}
});

Ext.reg('zarafa.freebusysuggestionlistpanel', Zarafa.common.freebusy.ui.SuggestionListPanel);
