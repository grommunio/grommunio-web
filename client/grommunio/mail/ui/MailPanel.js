/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-FileCopyrightText: Copyright 2016 Kopano and its licensors
 * SPDX-FileCopyrightText: Copyright 2005 - 2016 Zarafa B.V. and its licensors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.mail.ui');

/**
 * @class Grommunio.mail.ui.MailPanel
 * @extends Grommunio.common.ui.ContextMainPanel
 * @xtype grommunio.mailpanel
 */
Grommunio.mail.ui.MailPanel = Ext.extend(Grommunio.common.ui.ContextMainPanel, {
	// Insertion points for this class
	/**
	 * @insert context.mail.toolbar.item
	 * Insertion point for populating mail context's main toolbar.
	 * This item is only visible when this context is active.
	 * @param {Grommunio.mail.ui.MailPanel} panel This panel
	 */
	/**
	 * @insert context.mail.toolbar.paging
	 *
	 * Insertion point for populating mail context's toolbar with extra
	 * pagination buttons. This can be used to replace the default {@link Ext.PagingToolbar}
	 * with an alternative. Note that by default all paging toolbars will be visible, and
	 * hiding a particular toolbar is the responsibility of the new pagers.
	 * @param {Grommunio.mail.ui.MailPanel} panel This panel
	 */
	/**
	 * @insert context.mail.views
	 * Insertion point for adding views within the main panel of mail context.
	 * This insertion point should be used in combination with 'main.maintoolbar.view.mail'
	 * insertion point, and also view should set its store in the config object, the reference of
	 * {@link Grommunio.note.MailContextModel MailContextModel} is passed as parameter of this
	 * insertion point.
	 * @param {Grommunio.mail.ui.MailPanel} mainpanel This mainpanel
	 * @param {Grommunio.mail.MailContext} context The context for this panel
	 */

	/**
	 * The main panel in which the various views are located.
	 * @property
	 * @type Grommunio.core.ui.SwitchViewContentContainer
	 */
	viewPanel: undefined,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Overridden from Ext.Component
			xtype: 'grommunio.mailpanel',
			layout: 'grommunio.switchborder',
			items: [
				this.initMailGrid(config),
				this.initPreviewPanel(config.context)
			]
		});

		Grommunio.mail.ui.MailPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the {@link Grommunio.mail.ui.MailGrid MailGrid}
	 *
	 * @param {Object} config Configuration object
	 * @return {Grommunio.mail.ui.MailGrid}
	 * @private
	 */
	initMailGrid: function(config)
	{
		return {
			xtype: 'panel',
			layout: 'grommunio.collapsible',
			cls: 'grommunio-context-mainpanel',
			minWidth: 400,
			minHeight: 400,
			region: 'center',
			collapsible: false,
			split: true,
			items: [{
				xtype: 'grommunio.switchviewcontentcontainer',
				ref: '../viewPanel',
				layout: 'card',
				lazyItems: this.initViews(config.context)
			}],
			tbar: {
				xtype: 'grommunio.contextmainpaneltoolbar',
				id: 'grommunio-main-content-mail-toolbar',
				defaultTitle: _('Mail'),
				paging: container.populateInsertionPoint('context.mail.toolbar.paging', this),
				items: container.populateInsertionPoint('context.mail.toolbar.item', this),
				context: config.context
			},
			listeners: {
				render: function(panel)
				{
					this.topToolbar = panel.getTopToolbar();
				},
				scope: this
			}
		};
	},

	/**
	 * Function will initialize all views associated with mail context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Grommunio.mail.MailContextModel} model data part of mail context
	 * @return {Array} array of config objects of different views
	 * @private
	 */
	initViews: function(context)
	{
		// add the standard available views
		var allViews = [{
			xtype: 'grommunio.mailgrid',
			flex: 1,
			id  : 'mail-grid',
			anchor: '100%',
			context: context,
			ref: '../../mailGrid'
		}];

		var additionalViewItems = container.populateInsertionPoint('context.mail.views', this, context);
		allViews = allViews.concat(additionalViewItems);

		return allViews;
	},

	/**
	 * Function is used to get the {@link Grommunio.mail.ui.MailGrid mailgrid}
	 * return {Grommunio.mail.ui.MailGrid} return the mail grid.
	 */
	getGridPanel: function()
	{
		return this.mailGrid;
	},

	/**
	 * Initializes the {@link Grommunio.core.ui.PreviewPanel PreviewPanel}
	 *
	 * @param {Grommunio.mail.MailContext} context The Mail Context
	 * @return {Grommunio.core.ui.PreviewPanel}
	 * @private
	 */
	initPreviewPanel: function(context)
	{
		return {
			xtype: 'grommunio.mailpreviewpanel',
			id: 'grommunio-main-content-mail-preview',
			region: 'south',
			split: true,
			stateful: true,
			stateId: 'mail-preview-pane',
			context: context,
			ref: 'previewPanel'
		};
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
			this.mon(this.context, 'viewmodechange', this.onViewModeChange, this);

			this.onViewChange(this.context, this.context.getCurrentView());
			this.onViewModeChange(this.context, this.context.getCurrentViewMode());
		}
		Grommunio.mail.ui.MailPanel.superclass.initEvents.apply(this, arguments);
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Grommunio.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Grommunio.core.Context} context The context which fired the event.
	 * @param {Grommunio.mail.data.Views} newView The ID of the selected view.
	 * @param {Grommunio.mail.data.Views} oldView The ID of the previously selected view.
	 */
	onViewChange: function(context, newView, oldView)
	{
		switch (newView) {
			case Grommunio.mail.data.Views.LIST:
				this.viewPanel.switchView('mail-grid');
				break;
		}
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.core.Context} fires the
	 * {@link Grommunio.core.Context#viewmodechange viewmodechange} event. This will
	 * convert the configured {@link Grommunio.mail.data.ViewModes mode} to a
	 * {@link Grommunio.common.ui.layout.SwitchBorderLayout.Orientation orientation}
	 * to be {@link Grommunio.common.ui.layout.SwitchBorderLayout.setOrientation applied}
	 * to the {@link #layout}.
	 * @param {Grommunio.core.Context} context The context which fired the event
	 * @param {Grommunio.mail.data.ViewModes} newViewMode The new active mode
	 * @param {Grommunio.mail.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onViewModeChange: function(context, newViewMode, oldViewMode)
	{
		var orientation;
		var el = this.getEl();

		switch (newViewMode) {
			case Grommunio.mail.data.ViewModes.NO_PREVIEW:
				orientation = Grommunio.common.ui.layout.SwitchBorderLayout.Orientation.OFF;
				// Add a class for styling
				el.removeClass('grommunio-preview-bottom').removeClass('grommunio-preview-right').addClass('grommunio-preview-off');
				if (this.previewPanel) {
					this.previewPanel.hide();
				}
				break;
			case Grommunio.mail.data.ViewModes.RIGHT_PREVIEW:
				orientation = Grommunio.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL;
				// Add a class for styling
				el.removeClass('grommunio-preview-bottom').removeClass('grommunio-preview-off').addClass('grommunio-preview-right');
				if (this.previewPanel) {
					this.previewPanel.show();
				}
				break;
			case Grommunio.mail.data.ViewModes.BOTTOM_PREVIEW:
				orientation = Grommunio.common.ui.layout.SwitchBorderLayout.Orientation.VERTICAL;
				// Add a class for styling
				el.removeClass('grommunio-preview-off').removeClass('grommunio-preview-right').addClass('grommunio-preview-bottom');
				if (this.previewPanel) {
					this.previewPanel.show();
				}
				break;
			case Grommunio.mail.data.ViewModes.SEARCH:
			case Grommunio.mail.data.ViewModes.LIVESCROLL:
				return;
		}

		// This function could be called when the layout has not yet
		// been instantiated. In that case we update the layoutConfig
		// so it will be automatically picked up by the layout when
		// it needs it.
		var layout = this.getLayout();
		if (!Ext.isFunction(layout.setOrientation)) {
			if (Ext.isString(layout)) {
				this.layoutConfig = Ext.apply(this.layoutConfig || {}, { orientation: orientation });
			} else {
				this.layout.orientation = orientation;
			}
		} else {
			layout.setOrientation(orientation);
		}
	}
});

Ext.reg('grommunio.mailpanel', Grommunio.mail.ui.MailPanel);
