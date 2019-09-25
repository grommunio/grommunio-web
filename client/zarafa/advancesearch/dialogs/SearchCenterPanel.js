Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SearchCenterPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchcenterpanel
 *
 */
Zarafa.advancesearch.dialogs.SearchCenterPanel = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function (config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.searchContext)) {
			config.model = config.searchContext.getModel();
		}

		Ext.applyIf(config, {
			xtype : 'zarafa.searchcenterpanel',
			cls : 'k-searchcenterpanel',
			region : 'center',
			layout : 'fit',
			ref : 'centerRegion',
			unstyled : true,
			items : [{
				xtype : 'panel',
				layout : 'zarafa.switchborder',
				ref : 'switchBorder',
				border : false,
				unstyled : true,
				items : [{
					layout : 'fit',
					cls : 'zarafa-context-mainpanel',
					collapsible : false,
					region : 'center',
					items : [{
						xtype : 'zarafa.switchviewcontentcontainer',
						ref : '../viewPanel',
						layout : 'card',
						activeItem : 0,
						items : [{
							xtype : 'zarafa.searchgrid',
							flex : 1,
							id : 'search-grid' + (++Ext.Component.AUTO_ID),
							searchTabId : config.searchTabId,
							anchor : '100%',
							searchContext : config.searchContext,
							ref : '../../searchGrid',
							searchCenterPanel : this
						}]
					}]
				},{
					region : 'south',
					xtype : 'zarafa.searchresultpreviewpanel',
					ref : '../searchResultPreviewPanel',
					split : true,
					width : 400,
					height : 400,
					searchContext : config.searchContext
				}]
			}]
		});

		Zarafa.advancesearch.dialogs.SearchCenterPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function called by Extjs when the panel has been {@link #render rendered}.
	 * At this time all events can be registered.
	 * @private
	 */
	initEvents: function ()
	{
		if (Ext.isDefined(this.searchContext)) {
			this.switchBorder.mon(this.searchContext,{
				viewchange : this.onViewChange,
				viewmodechange : this.onViewModeChange,
				scope : this
			});

			this.switchBorder.on('afterlayout', this.onAfterLayout, this, {single: true});
		}
	},

	/**
	 * Function is used to get the {@link Zarafa.advancesearch.ui.SearchResultPreviewPanel searchResultPreviewPanel}
	 * @return {Object } return {@link Zarafa.advancesearch.ui.SearchResultPreviewPanel searchResultPreviewPanel}
	 */
	getSearchResultPreviewPanel: function ()
	{
		return this.searchResultPreviewPanel;
	},

	/**
	 * Event handler triggered when {@link Zarafa.core.ui.SwitchViewContentContainer Switch view content container}
	 * layout has been initialized
	 */
	onAfterLayout: function ()
	{
		this.onViewModeChange(this.searchContext, this.searchContext.getCurrentViewMode());
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Zarafa.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event.
	 * @param {Zarafa.common.data.Views} newView The ID of the selected view.
	 * @param {Zarafa.common.data.Views} oldView The ID of the previously selected view.
	 */
	onViewChange: function (context, newView, oldView)
	{
		if(newView === Zarafa.common.data.Views.LIST) {
			var searchGridId = this.switchBorder.searchGrid.getId();
			this.switchBorder.viewPanel.switchView(searchGridId);
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.core.Context} fires the
	 * {@link Zarafa.core.Context#viewmodechange viewmodechange} event. This will
	 * convert the configured {@link Zarafa.common.data.ViewModes mode} to a
	 * {@link Zarafa.common.ui.layout.SwitchBorderLayout.Orientation orientation}
	 * to be {@link Zarafa.common.ui.layout.SwitchBorderLayout.setOrientation applied}
	 * to the {@link #layout}.
	 * @param {Zarafa.core.Context} context The context which fired the event
	 * @param {Zarafa.common.data.ViewModes} newViewMode The new active mode
	 * @param {Zarafa.common.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onViewModeChange: function (context, newViewMode, oldViewMode)
	{
		var orientation;

		switch (newViewMode) {
			case Zarafa.common.data.ViewModes.NO_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.OFF;
				break;
			case Zarafa.common.data.ViewModes.RIGHT_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL;
				// hide the toolbar when right preview panel is enabled.
				this.getSearchResultPreviewPanel().getTopToolbar().onHide();
				break;
			case Zarafa.common.data.ViewModes.BOTTOM_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.VERTICAL;
				// show the toolbar when bottom preview panel is enabled and at lest one record
				// is selected in search grid.
				var record = this.model.getPreviewRecord();
				if (Ext.isDefined(record)) {
					this.getSearchResultPreviewPanel().getTopToolbar().onShow();
				}
				break;
			case Zarafa.common.data.ViewModes.SEARCH:
			case Zarafa.common.data.ViewModes.LIVESCROLL:
				return;
		}

		// This function could be called when the layout has not yet
		// been instantiated. In that case we update the layoutConfig
		// so it will be automatically picked up by the layout when
		// it needs it.
		var layout = this.switchBorder.getLayout();
		if (!Ext.isFunction(layout.setOrientation)) {
			if (Ext.isString(layout)) {
				this.layoutConfig = Ext.apply(this.layoutConfig || {}, {orientation: orientation});
			} else {
				this.layout.orientation = orientation;
			}
		} else {
			layout.setOrientation(orientation);
		}
	}
});

Ext.reg('zarafa.searchcenterpanel', Zarafa.advancesearch.dialogs.SearchCenterPanel);

