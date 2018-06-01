/*
 * #dependsFile client/zarafa/contact/data/SearchFields.js
 */
Ext.namespace('Zarafa.contact.ui');

/**
 * @class Zarafa.contact.ui.ContactMainPanel
 * @extends Zarafa.common.ui.ContextMainPanel
 * @xtype zarafa.contactmainpanel
 *
 * this class will be containing all the views that will be created for contacts folder.
 */
Zarafa.contact.ui.ContactMainPanel = Ext.extend(Zarafa.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.contact.toolbar.item
	 * Insertion point for populating contact context's main toolbar.
	 * This item is only visible when this context is active.
	 * @param {Zarafa.contact.ui.ContactMainPanel} panel This panel
	 */
	/**
	 * @insert context.contact.toolbar.paging
	 *
	 * Insertion point for populating contact context's toolbar with extra
	 * pagination buttons. This can be used to replace the default {@link Ext.PagingToolbar}
	 * with an alternative. Note that by default all paging toolbars will be visible, and
	 * hiding a particular toolbar is the responsibility of the new pagers.
	 * @param {Zarafa.contact.ui.ContactMainPanel} panel This panel
	 */
	/**
	 * @insert context.contact.views
	 * Insertion point for adding views within the main panel of contact context.
	 * This insertion point should be used in combination with 'main.maintoolbar.view.contact'
	 * insertion point, and also view should set its store in the config object, the reference of
	 * {@link Zarafa.contact.ContactContextModel ContactContextModel} is passed as parameter of this
	 * insertion point.
	 * @param {Zarafa.contact.ui.ContactMainPanel} mainpanel This mainpanel
	 * @param {Zarafa.contact.ContactContext} context The context for this panel
	 */

	/**
	 * The main panel in which the various views are located.
	 * @property
	 * @type Zarafa.core.ui.SwitchViewContentContainer
	 */
	viewPanel : undefined,

	/**
	 * @constructor
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.contactmainpanel',
			layout: 'fit',
			items: [{
				xtype: 'zarafa.switchviewcontentcontainer',
				ref: 'viewPanel',
				layout : 'card',
				lazyItems : this.initViews(config.context)
			}],
			tbar : {
				xtype: 'zarafa.contextmainpaneltoolbar',
				defaultTitle : _('Contacts'),
				paging : container.populateInsertionPoint('context.contact.toolbar.paging', this),
				items : container.populateInsertionPoint('context.contact.toolbar.item', this),
				context : config.context
			}
		});

		Zarafa.contact.ui.ContactMainPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function will initialize all views associated with contact context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Zarafa.contact.ContactContextModel} model data part of contact context
	 * @return {Array} array of config objects of different views
	 * @private
	 */
	initViews : function(context)
	{
		// add the standard available views
		var allViews = [{
			xtype : 'zarafa.contactgrid',
			id    : 'contact-gridview',
			context : context
		}, {
			xtype : 'zarafa.contactcardpanel',
			id    : 'contact-cardview',
			context : context
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
	 * @param {Zarafa.contact.ContactContext} context The context which fired the event
	 * @param {Zarafa.contact.data.Views} newView The ID of the selected view
	 * @param {Zarafa.contact.data.Views} oldView The ID of the previously selected view
	 * @private
	 */
	onViewChange : function(context, newView, oldView)
	{
		switch(newView) {
			case Zarafa.contact.data.Views.ICON:
				this.viewPanel.switchView('contact-cardview');
				break;
			case Zarafa.contact.data.Views.LIST:
			case Zarafa.contact.data.Views.SEARCH:
				this.viewPanel.switchView('contact-gridview');
				break;
		}
	}
});

Ext.reg('zarafa.contactmainpanel', Zarafa.contact.ui.ContactMainPanel);
