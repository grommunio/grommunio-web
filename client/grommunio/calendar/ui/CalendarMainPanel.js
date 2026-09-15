Ext.namespace('Grommunio.calendar.ui');

/**
 * @class Grommunio.calendar.ui.CalendarMainPanel
 * @extends Grommunio.common.ui.ContextMainPanel
 * @xtype grommunio.calendarmainpanel
 *
 * This class will be containing all the views that will be created for calendar folder
 */
Grommunio.calendar.ui.CalendarMainPanel = Ext.extend(Grommunio.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.calendar.toolbar.item
	 *
	 * Insertion point for populating calendar context's toolbar.
	 * This item is only visible when this context is active.
	 * @param {Grommunio.calendar.CalendarMainPanel} panel This panel
	 */
	/**
	 * @insert context.calendar.toolbar.paging
	 *
	 * Insertion point for populating calendar context's toolbar with extra
	 * pagination buttons. This can be used to replace the default {@link Ext.PagingToolbar}
	 * with an alternative. Note that by default all paging toolbars will be visible, and
	 * hiding a particular toolbar is the responsibility of the new pagers.
	 * @param {Grommunio.calendar.CalendarMainPanel} panel This panel
	 */
	/**
	 * @insert context.calendar.views
	 * Insertion point for adding views within the main panel of calendar context.
	 * This insertion point should be used in combination with 'main.maintoolbar.view.calendar'
	 * insertion point, and also view should set its store in the config object, the reference of
	 * {@link Grommunio.calendar.CalendarContext CalendarContext} is passed as parameter of this
	 * insertion point.
	 * @param {Grommunio.calendar.ui.CalendarMainPanel} mainpanel This mainpanel
	 * @param {Grommunio.calendar.CalendarContext} context The context for this panel
	 */

	/**
	 * The main panel in which the various views are located.
	 * @property
	 * @type Grommunio.core.ui.SwitchViewContentContainer
	 */
	viewPanel: undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype: 'grommunio.calendarmainpanel',
			layout: 'fit',
			items: [{
				xtype: 'grommunio.switchviewcontentcontainer',
				ref: 'viewPanel',
				layout: 'card',
				lazyItems: this.initViews(config.context)
			}],
			tbar: {
				xtype: 'grommunio.calendarpaneltoolbar',
				defaultTitle: _('Calendar'),
				paging: container.populateInsertionPoint('context.calendar.toolbar.paging', this),
				items: container.populateInsertionPoint('context.calendar.toolbar.item', this),
				context: config.context,
				model: config.context.getModel()
			}
		});

		Grommunio.calendar.ui.CalendarMainPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will initialize all views associated with contact context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Grommunio.calendar.CalendarContext} context The calendar context
	 * @return {Array} array of config objects of different views
	 * @private
	 */
	initViews: function(context)
	{
		// add the standard available views
		var allViews = [{
			xtype: 'grommunio.calendarblockpanel',
			id   : 'calendar_blocks',
			context: context
		},{
			xtype: 'grommunio.calendargrid',
			id   : 'calendar_grid',
			context: context
		}];

		var additionalViewItems = container.populateInsertionPoint('context.calendar.views', this, context);
		allViews = allViews.concat(additionalViewItems);

		return allViews;
	},

	/**
	 * Function called by Extjs when the panel has been {@link #render rendered}.
	 * At this time all events can be registered.
	 * @private
	 */
	initEvents: function()
	{
		if (Ext.isDefined(this.context)) {
			this.mon(this.context, 'viewchange', this.onViewChange, this);

			this.onViewChange(this.context, this.context.getCurrentView());
		}
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Grommunio.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Grommunio.core.Context} context The context which fired the event
	 * @param {Grommunio.calendar.data.Views} viewId The ID of the selected view
	 * @private
	 */
	onViewChange: function(context, viewId)
	{
		switch (viewId) {
			case Grommunio.calendar.data.Views.BLOCKS:
			/* falls through */
			default:
				this.viewPanel.switchView('calendar_blocks');
				break;
			case Grommunio.calendar.data.Views.LIST:
			case Grommunio.calendar.data.Views.SEARCH:
				this.viewPanel.switchView('calendar_grid');
				break;
		}
	}
});

Ext.reg('grommunio.calendarmainpanel', Grommunio.calendar.ui.CalendarMainPanel);
