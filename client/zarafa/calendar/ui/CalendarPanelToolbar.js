/*
 * #dependsFile client/zarafa/common/ui/ContextMainPanelToolbar.js
 */
Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.CalendarPanelToolbar
 * @extends Zarafa.common.ui.ContextMainPanelToolbar
 * @xtype zarafa.calendarpaneltoolbar
 *
 * A panel tool bar for the calendaring components. This consists of 2
 * separate sub-pagination toolbars. The {@link Zarafa.common.ui.PagingToolbar}
 * which is used in the ListView add by {@link Zarafa.common.ui.ContextMainPanelToolbar},
 * and a special pagination toolbar which indicates the daterange which is currently selected.
 * There are also folder title header and context related buttons like copy/move and delete
 * add by {@link Zarafa.common.ui.ContextMainPanelToolbar}.
 */
Zarafa.calendar.ui.CalendarPanelToolbar = Ext.extend(Zarafa.common.ui.ContextMainPanelToolbar, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		// Add an extra pagination toolbar
		config.paging = config.paging || [];
		config.paging.push({
			xtype: 'toolbar',
			ref : 'dateToolbar',
			items : [{
				xtype: 'button',
				iconCls: 'x-tbar-page-prev',
				handler: this.onPrevious,
				scope: this
			},{
				xtype: 'button',
				iconCls: 'x-tbar-page-next',
				handler: this.onNext,
				scope: this
			},{
				xtype: 'tbseparator'
			},{
				xtype: 'tbtext',
				ref: '../text'
			}]
		});

		Zarafa.calendar.ui.CalendarPanelToolbar.superclass.constructor.call(this, config);
	},

	/**
	 * Called automatically by superclass. This will initialize the component.
	 * @private
	 */
	initComponent : function()
	{
		Zarafa.calendar.ui.CalendarPanelToolbar.superclass.initComponent.call(this);

		if (this.model) {
			this.mon(this.model, 'daterangechange', this.onDateRangeChange, this);
			this.mon(this.model, 'datamodechange', this.onDataModeChange, this);

			this.on('afterlayout', this.onAfterFirstLayout, this, { single : true });
		}
	},

	/**
	 * Event handler for the {@link #afterlayout} event. This will update the {@link #text} from
	 * the {@link #model} and will update the {@link #onDataModeChange active datamode}.
	 * @private
	 */
	onAfterFirstLayout : function()
	{
		if (this.model) {
			this.text.setText(this.model.getDateRangeText());

			var mode = this.model.getCurrentDataMode();
			this.onDataModeChange(this.model, mode, mode);
		}
	},

	/**
	 * Event handler which is fired when the {@link #model} fires the {@link Zarafa.core.ContextModel#datamodechange}
	 * event. This will toggle the visible pagination toolbar depending on the current datamode.
	 * @param {Zarafa.calendar.CalendarContextModel} model The model on which datamode was changed
	 * @param {Zarafa.calendar.data.DataModes} mode The new mode which was applied
	 * @param {Zarafa.calendar.data.DataModes} oldMode the old mode which was previously applied
	 * @private
	 */
	onDataModeChange : function(model, mode, oldMode)
	{
		var hasDataModesAll = mode === Zarafa.calendar.data.DataModes.ALL;
		this.dateToolbar.setVisible(!hasDataModesAll);
		if (!hasDataModesAll) {
			// we have to set the width of tbtext field based on the different views of calendar
			// because when we navigate the months or days in calendar, text length of month/days 
			// gets resize the tbtext and due to that copy/delete button gets hide, to overcome this 
			// problem we give the fixed width to tbtext as per the calender view
			switch(mode) {
				case Zarafa.calendar.data.DataModes.WEEK:
				case Zarafa.calendar.data.DataModes.WORKWEEK:
					this.text.setWidth(250);
				break;
				case Zarafa.calendar.data.DataModes.DAY:
					this.text.setWidth(250);
				break;
				default:
					this.text.setWidth(120);
				break;
			}
		}

		this.doLayout();
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.core.DateRange DateRange}
	 * has been changed. This will update the help text inside the toolbar.
	 * @param {Zarafa.calendar.CalendarContextModel} model The model on which the daterange was set
	 * @param {Zarafa.core.data.DateRange} dateRange The new dateRange object
	 * @private
	 */
	onDateRangeChange : function(model, dateRange)
	{
		this.text.setText(model.getDateRangeText());
	},

	/**
	 * Event handler which is fired when the "Next" {@link Ext.Button button} was pressed.
	 * This will move the model to the next date period.
	 * @private
	 */
	onNext : function()
	{
		this.model.nextDate();
	},

	/**
	 * Event handler which is fired when the "Previous" {@link Ext.Button button} was pressed.
	 * This will move the model to the previous date period.
	 * @private
	 */
	onPrevious : function()
	{
		this.model.previousDate();
	}
});

Ext.reg('zarafa.calendarpaneltoolbar', Zarafa.calendar.ui.CalendarPanelToolbar);
