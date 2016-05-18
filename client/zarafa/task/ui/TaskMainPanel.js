/*
 * #dependsFile client/zarafa/task/data/SearchFields.js
 */
Ext.namespace('Zarafa.task.ui');

/**
 * @class Zarafa.task.ui.TaskMainPanel
 * @extends Zarafa.common.ui.ContextMainPanel
 * @xtype zarafa.taskmainpanel
 *
 * This class will be containing all the views that will be created for tasks folder.
 */
Zarafa.task.ui.TaskMainPanel = Ext.extend(Zarafa.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.task.toolbar.item
	 * Insertion point for populating Task context's main toolbar.
	 * This item is only visible when this context is active.
	 * @param {Zarafa.task.ui.TaskMainPanel} panel This panel
	 */
	/**
	 * @insert context.task.toolbar.paging
	 *
	 * Insertion point for populating task context's toolbar with extra
	 * pagination buttons. This can be used to replace the default {@link Ext.PagingToolbar}
	 * with an alternative. Note that by default all paging toolbars will be visible, and
	 * hiding a particular toolbar is the responsibility of the new pagers.
	 * @param {Zarafa.task.ui.TaskMainPanel} panel This panel
	 */
	/**
	 * @insert context.task.views
	 * Insertion point for adding views within the main panel of task context.
	 * This insertion point should be used in combination with 'main.maintoolbar.view.task'
	 * insertion point, and also view should set its store in the config object, the reference of
	 * {@link Zarafa.note.TaskContextModel TaskContextModel} is passed as parameter of this
	 * insertion point.
	 * @param {Zarafa.task.ui.TaskMainPanel} mainpanel This mainpanel
	 * @param {Zarafa.task.TaskContext} context The context for this panel
	 */

	/**
	 * The main panel in which the various views are located.
	 * @property
	 * @type Zarafa.core.ui.SwitchViewContentContainer
	 */
	viewPanel : undefined,

	/**
	 * @constructor
	 * @param taskcontext
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.taskmainpanel',
			layout: 'fit',
			items : [{
				xtype: 'zarafa.switchviewcontentcontainer',
				ref: 'viewPanel',
				layout : 'card',
				lazyItems : this.initViews(config.context)
			}],
			tbar : {
				xtype: 'zarafa.contextmainpaneltoolbar',
				defaultTitle : _('Tasks'),
				paging : container.populateInsertionPoint('context.task.toolbar.paging', this),
				items : container.populateInsertionPoint('context.task.toolbar.item', this),
				context : config.context
			}
		});

		Zarafa.task.ui.TaskMainPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will initialize all views associated with task context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Zarafa.task.TaskContextModel} model data part of task context
	 * @return {Array} array of config objects of different views
	 * @private
	 */
	initViews : function(context)
	{
		// add the standard available views
		var allViews = [{
			xtype : 'zarafa.taskgrid',
			id    : 'task-grid',
			context : context
		}];

		var additionalViewItems = container.populateInsertionPoint('context.task.views', this, context);
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
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Zarafa.task.data.Views} newView The ID of the selected view.
	 * @param {Zarafa.task.data.Views} oldView The ID of the previously selected view.
	 */
	onViewChange : function(context, newView, oldView)
	{
		switch (newView) {
			case Zarafa.task.data.Views.SEARCH:
			case Zarafa.task.data.Views.LIST:
				this.viewPanel.switchView('task-grid');
				break;
		}
	}
});

Ext.reg('zarafa.taskmainpanel', Zarafa.task.ui.TaskMainPanel);
