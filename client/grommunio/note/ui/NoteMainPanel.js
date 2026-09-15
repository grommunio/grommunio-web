Ext.namespace('Grommunio.note.ui');

/**
 * @class Grommunio.note.ui.NoteMainPanel
 * @extends Grommunio.common.ui.ContextMainPanel
 * @xtype grommunio.notemainpanel
 *
 * this class will be containing all the views that will be created for notes folder
 * main panel for the note content context
 */
Grommunio.note.ui.NoteMainPanel = Ext.extend(Grommunio.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.note.toolbar.item
	 * Insertion point for populating Note context's main toolbar.
	 * This item is only visible when this context is active.
	 * @param {Grommunio.note.ui.NoteMainPanel} panel This panel
	 */
	/**
	 * @insert context.note.toolbar.paging
	 *
	 * Insertion point for populating note context's toolbar with extra
	 * pagination buttons. This can be used to replace the default {@link Ext.PagingToolbar}
	 * with an alternative. Note that by default all paging toolbars will be visible, and
	 * hiding a particular toolbar is the responsibility of the new pagers.
	 * @param {Grommunio.note.ui.NoteMainPanel} panel This panel
	 */
	/**
	 * @insert context.note.views
	 * Insertion point for adding views within the main panel of note context.
	 * This insertion point should be used in combination with 'main.maintoolbar.view.note'
	 * insertion point, and also view should set its store in the config object, the reference of
	 * {@link Grommunio.note.NoteContextModel NoteContextModel} is passed as parameter of this
	 * insertion point.
	 * @param {Grommunio.note.ui.NoteMainPanel} mainpanel This mainpanel
	 * @param {Grommunio.note.NoteContext} context The context for this panel
	 */

	/**
	 * The main panel in which the various views are located.
	 * @property
	 * @type Grommunio.core.ui.SwitchViewContentContainer
	 */
	viewPanel: undefined,

	/**
	 * @constructor
	 * @param notecontext
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.notemainpanel',
			layout: 'fit',
			items: [{
				xtype: 'grommunio.switchviewcontentcontainer',
				ref: 'viewPanel',
				layout: 'card',
				lazyItems: this.initViews(config.context)
			}],
			tbar: {
				xtype: 'grommunio.contextmainpaneltoolbar',
				defaultTitle: _('Notes'),
				paging: container.populateInsertionPoint('context.note.toolbar.paging', this),
				items: container.populateInsertionPoint('context.note.toolbar.item', this),
				context: config.context
			}
		});

		Grommunio.note.ui.NoteMainPanel.superclass.constructor.call(this,config);
	},

	/**
	 * Function will initialize all views associated with note context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Grommunio.note.NoteContext} note context
	 * @return {Array} array of config objects of different views
	 * @private
	 */
	initViews: function(context)
	{
		// add the standard available views
		var allViews = [{
			xtype	: 'grommunio.noteiconview',//Icon View
			id	: 'note-iconview',
			context: context
		},{
			xtype	: 'grommunio.notegrid',//Grid View
			id	: 'note-gridview',
			context: context
		}];

		var additionalViewItems = container.populateInsertionPoint('context.note.views', this, context);
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
	 * has been updated. This will use the function
	 * {@link #viewPanel}#{@link Grommunio.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Grommunio.note.NoteContext} context The context which fired the event
	 * @param {Grommunio.note.data.Views} newView The ID of the selected view
	 * @param {Grommunio.note.data.Views} oldView The ID of the previously selected view
	 * @private
	 */
	onViewChange: function(context, newView, oldView)
	{
		switch (newView) {
			case Grommunio.note.data.Views.ICON:
				this.viewPanel.switchView('note-iconview');
				break;
			case Grommunio.note.data.Views.LIST:
			case Grommunio.note.data.Views.SEARCH:
				this.viewPanel.switchView('note-gridview');
				break;
		}
	}
});
//register xtype of note main panel
Ext.reg('grommunio.notemainpanel',Grommunio.note.ui.NoteMainPanel);
