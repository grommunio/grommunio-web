Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailPanel
 * @extends Zarafa.common.ui.ContextMainPanel
 * @xtype zarafa.mailpanel
 */
Zarafa.mail.ui.MailPanel = Ext.extend(Zarafa.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.mail.toolbar.item
	 * Insertion point for populating mail context's main toolbar.
	 * This item is only visible when this context is active.
	 * @param {Zarafa.mail.ui.MailPanel} panel This panel
	 */
	/**
	 * @insert context.mail.toolbar.paging
	 *
	 * Insertion point for populating mail context's toolbar with extra
	 * pagination buttons. This can be used to replace the default {@link Ext.PagingToolbar}
	 * with an alternative. Note that by default all paging toolbars will be visible, and
	 * hiding a particular toolbar is the responsibility of the new pagers.
	 * @param {Zarafa.mail.ui.MailPanel} panel This panel
	 */
	/**
	 * @insert context.mail.views
	 * Insertion point for adding views within the main panel of mail context.
	 * This insertion point should be used in combination with 'main.maintoolbar.view.mail'
	 * insertion point, and also view should set its store in the config object, the reference of
	 * {@link Zarafa.note.MailContextModel MailContextModel} is passed as parameter of this
	 * insertion point.
	 * @param {Zarafa.mail.ui.MailPanel} mainpanel This mainpanel
	 * @param {Zarafa.mail.MailContext} context The context for this panel
	 */

	/**
	 * The main panel in which the various views are located.
	 * @property
	 * @type Zarafa.core.ui.SwitchViewContentContainer
	 */
	viewPanel : undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'zarafa.mailpanel',
			layout : 'zarafa.switchborder',
			items : [
				this.initMailGrid(config),
				this.initPreviewPanel(config.context)
			]
		});

		Zarafa.mail.ui.MailPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the {@link Zarafa.mail.ui.MailGrid MailGrid}
	 *
	 * @param {Object} config Configuration object
	 * @return {Zarafa.mail.ui.MailGrid}
	 * @private
	 */
	initMailGrid : function(config)
	{
		return {
			xtype: 'panel',
			layout: 'zarafa.collapsible',
			cls : 'zarafa-context-mainpanel',
			minWidth : 200,
			minHeight: 200,
			region : 'center',
			collapsible : false,
			split : true,
			items: [{
				xtype: 'zarafa.switchviewcontentcontainer',
				ref: '../viewPanel',
				layout : 'card',
				lazyItems : this.initViews(config.context)
			}],
			tbar : {
				xtype: 'zarafa.mailpaneltoolbar',
				id: 'zarafa-main-content-mail-toolbar',
				defaultTitle : _('Mail'),
				paging : container.populateInsertionPoint('context.mail.toolbar.paging', this),
				items : container.populateInsertionPoint('context.mail.toolbar.item', this),
				context : config.context
			},
			listeners : {
				render : function(panel)
				{
					this.topToolbar = panel.getTopToolbar();
				},
				scope : this
			}
		};
	},

	/**
	 * Function will initialize all views associated with mail context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Zarafa.mail.MailContextModel} model data part of mail context
	 * @return {Array} array of config objects of different views
	 * @private
	 */
	initViews : function(context)
	{
		// add the standard available views
		var allViews = [{
			xtype: 'zarafa.mailgrid',
			flex: 1,
			id    : 'mail-grid',
			anchor: '100%',
			context : context,
			ref: '../../mailGrid'
		}];

		var additionalViewItems = container.populateInsertionPoint('context.mail.views', this, context);
		allViews = allViews.concat(additionalViewItems);

		return allViews;
	},

	/**
	 * Function is used to get the {@link Zarafa.mail.ui.MailGrid mailgrid}
	 * return {Zarafa.mail.ui.MailGrid} return the mail grid.
	 */
	getGridPanel : function()
	{
		return this.mailGrid;
	}, 

	/**
	 * Initializes the {@link Zarafa.core.ui.PreviewPanel PreviewPanel}
	 *
	 * @param {Zarafa.mail.MailContext} context The Mail Context
	 * @return {Zarafa.core.ui.PreviewPanel}
	 * @private
	 */
	initPreviewPanel : function(context)
	{
		return {
			xtype: 'zarafa.mailpreviewpanel',
			id: 'zarafa-main-content-mail-preview',
			region : 'south',
			split : true,
			context: context
		};
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
			this.mon(this.context, 'viewmodechange', this.onViewModeChange, this);

			this.onViewChange(this.context, this.context.getCurrentView());
			this.onViewModeChange(this.context, this.context.getCurrentViewMode());
		}
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Zarafa.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Zarafa.mail.data.Views} newView The ID of the selected view.
	 * @param {Zarafa.mail.data.Views} oldView The ID of the previously selected view.
	 */
	onViewChange : function(context, newView, oldView)
	{
		switch (newView) {
			case Zarafa.mail.data.Views.LIST:
				this.viewPanel.switchView('mail-grid');
				break;
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.core.Context} fires the
	 * {@link Zarafa.core.Context#viewmodechange viewmodechange} event. This will
	 * convert the configured {@link Zarafa.mail.data.ViewModes mode} to a
	 * {@link Zarafa.common.ui.layout.SwitchBorderLayout.Orientation orientation}
	 * to be {@link Zarafa.common.ui.layout.SwitchBorderLayout.setOrientation applied}
	 * to the {@link #layout}.
	 * @param {Zarafa.core.Context} context The context which fired the event
	 * @param {Zarafa.mail.data.ViewModes} newViewMode The new active mode
	 * @param {Zarafa.mail.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onViewModeChange : function(context, newViewMode, oldViewMode)
	{
		var orientation;
		var el = this.getEl();

		switch (newViewMode) {
			case Zarafa.mail.data.ViewModes.NO_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.OFF;
				// Add a class for styling
				el.removeClass('zarafa-preview-bottom').removeClass('zarafa-preview-right').addClass('zarafa-preview-off');
				break;
			case Zarafa.mail.data.ViewModes.RIGHT_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL;
				// Add a class for styling
				el.removeClass('zarafa-preview-bottom').removeClass('zarafa-preview-off').addClass('zarafa-preview-right');
				break;
			case Zarafa.mail.data.ViewModes.BOTTOM_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.VERTICAL;
				// Add a class for styling
				el.removeClass('zarafa-preview-off').removeClass('zarafa-preview-right').addClass('zarafa-preview-bottom');
				break;
			case Zarafa.mail.data.ViewModes.SEARCH:
			case Zarafa.mail.data.ViewModes.LIVESCROLL:
				return;
		}

		// This function could be called when the layout has not yet
		// been instantiated. In that case we update the layoutConfig
		// so it will be automatically picked up by the layout when
		// it needs it.
		var layout = this.getLayout();
		if (!Ext.isFunction(layout.setOrientation)) {
			if (Ext.isString(layout)) {
				this.layoutConfig = Ext.apply(this.layoutConfig || {}, { orientation : orientation });
			} else {
				this.layout.orientation = orientation;
			}
		} else {
			layout.setOrientation(orientation);
		}
	}
});

Ext.reg('zarafa.mailpanel', Zarafa.mail.ui.MailPanel);

