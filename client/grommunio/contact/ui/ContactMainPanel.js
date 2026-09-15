/*
 * #dependsFile client/grommunio/contact/data/SearchFields.js
 */
Ext.namespace('Grommunio.contact.ui');

/**
 * @class Grommunio.contact.ui.ContactMainPanel
 * @extends Grommunio.common.ui.ContextMainPanel
 * @xtype grommunio.contactmainpanel
 *
 * this class will be containing all the views that will be created for contacts folder.
 */
Grommunio.contact.ui.ContactMainPanel = Ext.extend(Grommunio.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.contact.toolbar.item
	 * Insertion point for populating contact context's main toolbar.
	 * This item is only visible when this context is active.
	 * @param {Grommunio.contact.ui.ContactMainPanel} panel This panel
	 */
	/**
	 * @insert context.contact.toolbar.paging
	 *
	 * Insertion point for populating contact context's toolbar with extra
	 * pagination buttons. This can be used to replace the default {@link Ext.PagingToolbar}
	 * with an alternative. Note that by default all paging toolbars will be visible, and
	 * hiding a particular toolbar is the responsibility of the new pagers.
	 * @param {Grommunio.contact.ui.ContactMainPanel} panel This panel
	 */
	/**
	 * @insert context.contact.views
	 * Insertion point for adding views within the main panel of contact context.
	 * This insertion point should be used in combination with 'main.maintoolbar.view.contact'
	 * insertion point, and also view should set its store in the config object, the reference of
	 * {@link Grommunio.contact.ContactContextModel ContactContextModel} is passed as parameter of this
	 * insertion point.
	 * @param {Grommunio.contact.ui.ContactMainPanel} mainpanel This mainpanel
	 * @param {Grommunio.contact.ContactContext} context The context for this panel
	 */

	/**
	 * The main panel in which the various views are located.
	 * @property
	 * @type Grommunio.core.ui.SwitchViewContentContainer
	 */
	viewPanel: undefined,

	/**
	 * @constructor
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'grommunio.contactmainpanel',
			layout: 'fit',
			items: [{
				xtype: 'grommunio.switchviewcontentcontainer',
				ref: 'viewPanel',
				layout: 'card',
				lazyItems: this.initViews(config.context)
			}],
			tbar: {
				xtype: 'grommunio.contextmainpaneltoolbar',
				defaultTitle: _('Contacts'),
				paging: container.populateInsertionPoint('context.contact.toolbar.paging', this),
				items: container.populateInsertionPoint('context.contact.toolbar.item', this),
				context: config.context
			}
		});

		Grommunio.contact.ui.ContactMainPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will initialize all views associated with contact context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Grommunio.contact.ContactContextModel} model data part of contact context
	 * @return {Array} array of config objects of different views
	 * @private
	 */
	initViews: function(context)
	{
		// add the standard available views
		var allViews = [{
			xtype: 'grommunio.contactgrid',
			id  : 'contact-gridview',
			context: context
		}, {
			xtype: 'grommunio.contactcardpanel',
			id  : 'contact-cardview',
			context: context
		}];

		var additionalViewItems = container.populateInsertionPoint('context.contact.views', this, context);
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
	 * @param {Grommunio.contact.ContactContext} context The context which fired the event
	 * @param {Grommunio.contact.data.Views} newView The ID of the selected view
	 * @param {Grommunio.contact.data.Views} oldView The ID of the previously selected view
	 * @private
	 */
	onViewChange: function(context, newView, oldView)
	{
		switch(newView) {
			case Grommunio.contact.data.Views.ICON:
				this.viewPanel.switchView('contact-cardview');
				break;
			case Grommunio.contact.data.Views.LIST:
			case Grommunio.contact.data.Views.SEARCH:
				this.viewPanel.switchView('contact-gridview');
				break;
		}
	}
});

Ext.reg('grommunio.contactmainpanel', Grommunio.contact.ui.ContactMainPanel);
