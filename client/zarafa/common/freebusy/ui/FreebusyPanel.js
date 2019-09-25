Ext.namespace('Zarafa.common.freebusy.ui');

/**
 * @class Zarafa.common.freebusy.ui.FreebusyPanel
 * @extends Ext.Panel
 * @xtype zarafa.freebusypanel
 */
Zarafa.common.freebusy.ui.FreebusyPanel = Ext.extend(Ext.Panel, {
	/**
	 * @cfg {Zarafa.common.freebusy.data.FreebusyBlockStore} blockStore
	 * The {@link Ext.data.Store} object that handles the freebusy blocks displayed on the timeline.
	 */
	blockStore: null,
	/**
	 * @cfg {Ext.data.Store} userStore
	 * The {@link Ext.data.Store} object that handles the list of users loaded. It can be a normal
	 * store, but it is preferably an {@link  Zarafa.core.data.IPMRecipientStore}.
	 */
	userStore: null,
	/**
	 * @cfg {Zarafa.common.freebusy.data.FreebusyModel} model
	 * The model that keeps track of the userStore, dates, etc.
	 */
	model: null,
	/**
	 * @cfg {Object} userlistConfig The configuration object which will be applied
	 * to the {@link Zarafa.common.freebusy.ui.UserListView UserListView} object.
	 */
	userlistConfig: null,
	/**
	 * @cfg {Object} timelineConfig The configuration object which will be applied
	 * to the {@link Zarafa.common.freebusy.ui.TimelineView TimelineView} object.
	 */
	timelineConfig: null,
	/**
	 * @cfg {Object} suggestionConfig The configuration object which will be applied
	 * to the {@link Zarafa.common.freebusy.ui.SuggestionListView SuggestionListView} object.
	 */
	suggestionConfig: null,
	/**
	 * @cfg {Object} legendaConfig The configuration object which will be applied
	 * to the {@link Ext.Panel legendaView} object.
	 */
	legendaConfig: null,
	/**
	 * @cfg {Boolean} showUserList
	 * When set to true it will show the userlist to the left. When set to false it will hide it
	 * (defaults to true).
	 */
	showUserList: true,
	/**
	 * @cfg {Boolean} showSuggestionList
	 * When set to true it will show the Suggestionlist to the left. When set to false it will hide it
	 * (defaults to true).
	 */
	showSuggestionList : true,
	/**
	 * @cfg {Boolean} editable
	 * When set to false it will make the userlist non-editable (defaults to true).
	 */
	editable: true,
	/**
	 * @cfg {Boolean} showLegenda
	 * When set to true it will show the legenda at the bottom. When set to false it will hide it
	 * (defaults to true).
	 */
	showLegenda: true,
	/**
	 * @cfg {Number} headerHeight
	 * Height of the header that will be set for the {@link Zarafa.common.freebusy.ui.UserlistView} and the
	 * {@link Zarafa.common.freebusy.ui.TimelineView} (defaults to 50).
	 */
//	headerHeight: 50,
	// Private
	// Height of inputfield that will be shown in the {@link Zarafa.common.freebusy.ui.UserlistView}.
	inputfieldHeight: 20,
	/**
	 * @cfg {Boolean} initialScrollToCurrentDay
	 * When set to true it will scroll to the current day or the selected period. This is done after
	 * the initial laying out (Defaults to true).
	 */
	initialScrollToCurrentDay: true,
	// Private
	// The afterlayout event triggers the scrolling of the timeline to the current day or selection.
	// This flag indicates whether we should react the afterlayout event or whether this has already
	// happened.
	initialScrollDone: false,

	/**
	 * @constructor
	 * @param {Object} config The configuration options.
	 */
	constructor: function(config)
	{
		config = config || {};

		var modelConfig = config.modelConfig || {};
		Ext.applyIf(modelConfig, {
			userStore: config.userStore,
			blockStore: config.blockStore
		});
		var model = new Zarafa.common.freebusy.data.FreebusyModel(modelConfig);

		Ext.applyIf(config, {
			layout: 'border',
			border: true,

			blockStore: model.getBlockStore(),
			userStore: model.getUserStore(),
			model: model,

			userlistConfig: {},
			timelineConfig: {},
			suggestionConfig: {},
			legendaConfig: {}
		});

		Zarafa.common.freebusy.ui.FreebusyPanel.superclass.constructor.call(this, config);

		this.add([
			this.createUserListView(),
			this.createSuggestionView(),
			this.createTimelineView(),
			this.createLegendaView()
		]);

		this.initFreebusyEvents();
	},

	/**
	 * This will create the listview panel containing all the users for
	 * which the freebusy should be shown.
	 * @return {Object} Configuration object for the user listview
	 * @private
	 */
	createUserListView : function()
	{
		return {
			xtype: 'panel',
			ref: 'userListView',
			region: 'west',
			layout: 'fit',
			title: _('Select attendees'),
			hidden: (!this.showUserList),
			cls: 'x-freebusy-userlist',
			footer: true,
			footerCfg: {
				tag: 'div',
				cls: 'x-panel-footer'
			},
			border: true,
			width: 200,
			collapsible: true,
			split: true,
			items: [Ext.applyIf(this.userlistConfig, {
				xtype: 'zarafa.freebusyuserlistview',

				model: this.model,

				inputFieldHeight: (this.editable) ? this.inputfieldHeight : 0,
				editable: this.editable
			})]
		};
	},

	/**
	 * This will create the suggestion listview which contains all possible
	 * times for an appointment for the selected users on a given day.
	 * @return {Object} Configuration object for the suggestion listview
	 * @private
	 */
	createSuggestionView : function()
	{
		return {
			xtype: 'panel',
			ref: 'suggestionListView',
			region: 'east',
			layout: 'fit',
			title: _('Suggested Times'),
			hidden: (!this.showSuggestionList),
			cls: 'zarafa-freebusy-suggestionlist',
			footer: true,
			footerCfg: {
				tag: 'div',
				cls: 'x-panel-footer'
			},
			border: true,
			width: 200,
			collapsible: true,
			split: true,
			items: [Ext.applyIf(this.suggestionConfig, {
				xtype: 'zarafa.freebusysuggestionlistpanel',

				model: this.model,

				listeners: {
					select: this.onSelectSuggestion,
					dateselect: this.onSuggestionDateSelect,
					scope: this
				}
			})]
		};
	},

	/**
	 * This will create the timeline panel which contains all the freebusy blocks
	 * for each user which has been selected.
	 * @return {Object} Configuration object for the timelineview
	 * @private
	 */
	createTimelineView : function()
	{
		return Ext.applyIf(this.timelineConfig, {
			xtype: 'zarafa.freebusytimelineview',
			ref: 'timelineView',
			region: 'center',
			blockStore: this.blockStore,
			model: this.model,
			selector: new Zarafa.common.freebusy.data.TimelineSelector(),
			extraBodyHeight: (this.editable) ? this.inputfieldHeight : 0,
			// TODO: Make this configurable and toggable
			hideNonWorkingHours: true,
			listeners: {
				bodyscroll : this.onTimelineScroll,
				scope: this
			}
		});
	},

	/**
	 * This will create the legenda panel which contains all the possible
	 * block colors which will be used in the timelineview.
	 * @return {Object} configuration object for the legenda
	 * @private
	 */
	createLegendaView : function()
	{
		return Ext.applyIf(this.legendaConfig, {
			xtype: 'container',
			region: 'south',
			border: false,
			layout: 'hbox',
			hidden: (!this.showLegenda),
			autoHeight: true,
			cls: 'x-freebusy-timeline-container x-freebusy-legenda',
			items: [{
				xtype: 'container',
				cls: 'x-freebusy-timeline-block-busy',
				width: 24,
				height: 24
			},{
				xtype: 'displayfield',
				value: _('Busy'),
				hideLabel : true,
				autoWidth: true
			},{
				xtype: 'container',
				cls: 'x-freebusy-timeline-block-tentative',
				width: 24,
				height: 24
			},{
				xtype: 'displayfield',
				value: _('Tentative'),
				hideLabel : true,
				autoWidth: true
			},{
				xtype: 'container',
				cls: 'x-freebusy-timeline-block-outofoffice',
				width: 24,
				height: 24
			},{
				xtype: 'displayfield',
				value: _('Out of Office'),
				hideLabel : true,
				autoWidth: true
			},{
				xtype: 'container',
				cls: 'x-freebusy-timeline-block-blur',
				width: 24,
				height: 24
			},{
				xtype: 'displayfield',
				value: _('No Information'),
				hideLabel : true,
				autoWidth: true
			}]
		});
	},

	/**
	 * Initialize freebusy events
	 * @private
	 */
	initFreebusyEvents: function()
	{
		// Register to afterlayout to support the timeline in scrolling to the current day
		this.on('afterlayout', this.onAfterLayout, this);
	},

	/**
	 * Returns the model.
	 * @return {Zarafa.common.freebusy.data.FreebusyModel} Model
	 */
	getModel: function()
	{
		return this.model;
	},

	/**
	 * Change the {@link #editable} field on this panel
	 * @param {Boolean} value The new editable status
	 */
	setEditable : function(value)
	{
		if (this.editable !== value) {
			this.editable = value;
			this.userListView.get(0).setEditable(value);
		}
	},

	/**
	 * Is called when the layouting is done and the sizes are calculated. When the timeline needs to
	 * be scrolled to the current day or selection, this listener triggers the scrolling. It looks
	 * for the first usable afterlayout event and the ones after that will not trigger any scrolling
	 * anymore. The first usable event is the one where the container has a width larger than zero.
	 * @param {Ext.Container} container Container
	 * @private
	 */
	onAfterLayout: function(container)
	{
		// Calculate the desired header size, we have the configured header size, but we need
		// to substract any padding/borders and margins which are applied to the header.
		if (this.userListView) {
			var height = this.headerHeight;

			height -= this.userListView.header.getMargins('tb');
			height -= this.userListView.header.getBorderWidth('tb');
			height -= this.userListView.header.getPadding('tb');

			this.userListView.header.setStyle('height', height + 'px');

			// Ext.getScrollBarWidth() is always off by 2 pixels, this is a hardcoded
			// thing, so we can fix it hardcoded...
			this.userListView.footer.setStyle('height', (Ext.getScrollBarWidth() - 2) + 'px');
		}
		if (this.suggestionListView) {
			var height = this.headerHeight;

			height -= this.userListView.header.getMargins('tb');
			height -= this.userListView.header.getBorderWidth('tb');
			height -= this.userListView.header.getPadding('tb');

			this.suggestionListView.header.setStyle('height', height + 'px');
			// Ext.getScrollBarWidth() is always off by 2 pixels, this is a hardcoded
			// thing, so we can fix it hardcoded...
			this.suggestionListView.footer.setStyle('height', (Ext.getScrollBarWidth() - 2) + 'px');
		}

		if (this.initialScrollToCurrentDay) {
			/**
			 * We only need to scroll to the current day or selection once at startup. We have to
			 * look for the first afterlayout event with a container that has a width larger than 0.
			 */
			 // @TODO every time on layout we must need to scroll timeline to current selection as "scroll" event is not working properly in IE.
			if (!Ext.isIE && (this.initialScrollDone || this.timelineView.getWidth() === 0)) {
				return;
			} else {
				this.initialScrollDone = true;
			}

			this.scrollTimelineToSelection();
		}
	},

	/**
	 * Scroll the TimelineView to the current Selector date, or to
	 * the current date if no selector is available.
	 */
	scrollTimelineToSelection : function()
	{
		if (this.timelineView.selector) {
			this.timelineView.selector.scrollTimelineToSelection();
		} else {
			this.timelineView.scrollDateIntoView(new Date());
		}
	},

	/**
	 * Scroll the TimelineView to the provided date argument.
	 * @param {Date} date Date object
	 */
	scrollTimelineToDate : function(date)
	{
		this.timelineView.scrollDateIntoView(date);
	},

	/**
	 * Used to syncronize the scrolling height of the timeline view with the user list
	 * @param {Object} scrollPos Scroll position
	 * @private
	 */
	onTimelineScroll: function(scrollPos)
	{
		this.userListView.body.scrollTo('top', scrollPos.top);
	},

	/**
	 * Fired when the user clicks on a suggestion from the SuggestionPanel.
	 * This will update the Selector DateRange to match the suggestion.
	 * @param {Zarafa.common.freebusy.ui.SuggestionListPanel} panel The panel which raised the event
	 * @param {Zarafa.common.freebusy.data.FreebusyBlockRecord} record The selected suggestion
	 * @private
	 */
	onSelectSuggestion : function(panel, record)
	{
		var start = record.get('start') * 1000;
		var end = record.get('end') * 1000;

		this.getModel().getSelectorRange().setTime(start, end);
	},

	/**
	 * Called when the {@link Zarafa.common.freebusy.ui.SuggestionListPanel SuggestionListPanel} fires
	 * the {@link Zarafa.common.freebusy.ui.SuggestionListPanel#dateselect dateselect} event.
	 * @param {Zarafa.common.freebusy.ui.SuggestionListPanel} this This panel
	 * @param {Date} date The selected date
	 * @private
	 */
	onSuggestionDateSelect: function(suggestionListPanel, date)
	{
		this.scrollTimelineToDate(date);
	}

});

Ext.reg('zarafa.freebusypanel',Zarafa.common.freebusy.ui.FreebusyPanel);
