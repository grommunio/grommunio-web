Ext.namespace('Zarafa.calendar.ui');

/**
 * @class Zarafa.calendar.ui.CalendarMainPanel
 * @extends Zarafa.common.ui.ContextMainPanel
 * @xtype zarafa.calendarmainpanel
 *
 * This class will be containing all the views that will be created for calendar folder
 */
Zarafa.calendar.ui.CalendarMainPanel = Ext.extend(Zarafa.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.calendar.toolbar.item
	 *
	 * Insertion point for populating calendar context's toolbar.
	 * This item is only visible when this context is active. 
	 * @param {Zarafa.calendar.CalendarMainPanel} panel This panel
	 */
	/**
	 * @insert context.calendar.toolbar.paging
	 *
	 * Insertion point for populating calendar context's toolbar with extra
	 * pagination buttons. This can be used to replace the default {@link Ext.PagingToolbar}
	 * with an alternative. Note that by default all paging toolbars will be visible, and
	 * hiding a particular toolbar is the responsibility of the new pagers.
	 * @param {Zarafa.calendar.CalendarMainPanel} panel This panel
	 */
	/**
	 * @insert context.calendar.views
	 * Insertion point for adding views within the main panel of calendar context.
	 * This insertion point should be used in combination with 'main.maintoolbar.view.calendar'
	 * insertion point, and also view should set its store in the config object, the reference of
	 * {@link Zarafa.calendar.CalendarContext CalendarContext} is passed as parameter of this
	 * insertion point.
	 * @param {Zarafa.calendar.ui.CalendarMainPanel} mainpanel This mainpanel
	 * @param {Zarafa.calendar.CalendarContext} context The context for this panel
	 */

	/**
	 * The main panel in which the various views are located.
	 * @property
	 * @type Zarafa.core.ui.SwitchViewContentContainer
	 */
	viewPanel : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config = Ext.applyIf(config, {
			xtype : 'zarafa.calendarmainpanel',
			layout: 'fit',
			items: [{
				xtype: 'zarafa.switchviewcontentcontainer',
				ref: 'viewPanel',
				layout : 'card',
				lazyItems : this.initViews(config.context)
			}],
			tbar : {
				xtype: 'zarafa.calendarpaneltoolbar',
				defaultTitle : _('Calendar'),
				paging : container.populateInsertionPoint('context.calendar.toolbar.paging', this),
				items : container.populateInsertionPoint('context.calendar.toolbar.item', this),
				context : config.context,
				model : config.context.getModel()
			}
		});

		Zarafa.calendar.ui.CalendarMainPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will initialize all views associated with contact context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Zarafa.calendar.CalendarContext} context The calendar context
	 * @return {Array} array of config objects of different views
	 * @private
	 */
	initViews : function(context)
	{
		// add the standard available views
		var allViews = [{
			xtype : 'zarafa.calendarblockpanel',
			id    : 'calendar_blocks',
			context : context
		},{
			xtype : 'zarafa.calendargrid',
			id    : 'calendar_grid',
			context : context
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
	initEvents : function()
	{
		if (Ext.isDefined(this.context)) {
			this.mon(this.context, 'viewchange', this.onViewChange, this);

			this.onViewChange(this.context, this.context.getCurrentView());
		}
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Zarafa.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event
	 * @param {Zarafa.calendar.data.Views} viewId The ID of the selected view
	 * @private
	 */
	onViewChange : function(context, viewId)
	{
		switch (viewId) {
			case Zarafa.calendar.data.Views.BLOCKS:
			/* falls through */
			default:
				this.viewPanel.switchView('calendar_blocks');
				break;
			case Zarafa.calendar.data.Views.LIST:
			case Zarafa.calendar.data.Views.SEARCH:
				this.viewPanel.switchView('calendar_grid');
				break;
		}
	}
});

Ext.reg('zarafa.calendarmainpanel', Zarafa.calendar.ui.CalendarMainPanel);
