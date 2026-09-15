Ext.namespace('Grommunio.advancesearch.dialogs');

/**
 * @class Grommunio.advancesearch.dialogs.SearchCenterPanel
 * @extends Ext.Panel
 * @xtype grommunio.searchcenterpanel
 *
 */
Grommunio.advancesearch.dialogs.SearchCenterPanel = Ext.extend(Ext.Panel, {

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
			xtype: 'grommunio.searchcenterpanel',
			cls: 'k-searchcenterpanel',
			region: 'center',
			layout: 'fit',
			ref: 'centerRegion',
			unstyled: true,
			items: [{
				xtype: 'panel',
				layout: 'grommunio.switchborder',
				ref: 'switchBorder',
				border: false,
				unstyled: true,
				items: [{
					layout: 'fit',
					cls: 'grommunio-context-mainpanel',
					collapsible: false,
					region: 'center',
					minHeight: 200,
					minWidth: 300,
					items: [{
						xtype: 'grommunio.switchviewcontentcontainer',
						ref: '../viewPanel',
						layout: 'card',
						activeItem: 0,
						items: [{
							xtype: 'grommunio.searchgrid',
							flex: 1,
							id: 'search-grid' + (++Ext.Component.AUTO_ID),
							searchTabId: config.searchTabId,
							anchor: '100%',
							searchContext: config.searchContext,
							ref: '../../searchGrid',
							searchCenterPanel: this
						}]
					}]
				},{
					region: 'south',
					xtype: 'grommunio.searchresultpreviewpanel',
					ref: '../searchResultPreviewPanel',
					split: true,
					width: 400,
					height: 400,
					minWidth: 400,
					minHeight: 200,
					searchContext: config.searchContext
				}]
			}]
		});

		Grommunio.advancesearch.dialogs.SearchCenterPanel.superclass.constructor.call(this, config);
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
				viewchange: this.onViewChange,
				viewmodechange: this.onViewModeChange,
				scope: this
			});

			this.switchBorder.on('afterlayout', this.onAfterLayout, this, {single: true});
		}
	},

	/**
	 * Function is used to get the {@link Grommunio.advancesearch.ui.SearchResultPreviewPanel searchResultPreviewPanel}
	 * @return {Object } return {@link Grommunio.advancesearch.ui.SearchResultPreviewPanel searchResultPreviewPanel}
	 */
	getSearchResultPreviewPanel: function ()
	{
		return this.searchResultPreviewPanel;
	},

	/**
	 * Event handler triggered when {@link Grommunio.core.ui.SwitchViewContentContainer Switch view content container}
	 * layout has been initialized
	 */
	onAfterLayout: function ()
	{
		this.onViewModeChange(this.searchContext, this.searchContext.getCurrentViewMode());
	},

	/**
	 * Event handler which is fired when the currently active view inside the {@link #context}
	 * has been updated. This will update the call
	 * {@link #viewPanel}#{@link Grommunio.core.ui.SwitchViewContentContainer#switchView}
	 * to make the requested view active.
	 *
	 * @param {Grommunio.core.Context} context The context which fired the event.
	 * @param {Grommunio.common.data.Views} newView The ID of the selected view.
	 * @param {Grommunio.common.data.Views} oldView The ID of the previously selected view.
	 */
	onViewChange: function (context, newView, oldView)
	{
		if(newView === Grommunio.common.data.Views.LIST) {
			var searchGridId = this.switchBorder.searchGrid.getId();
			this.switchBorder.viewPanel.switchView(searchGridId);
		}
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.core.Context} fires the
	 * {@link Grommunio.core.Context#viewmodechange viewmodechange} event. This will
	 * convert the configured {@link Grommunio.common.data.ViewModes mode} to a
	 * {@link Grommunio.common.ui.layout.SwitchBorderLayout.Orientation orientation}
	 * to be {@link Grommunio.common.ui.layout.SwitchBorderLayout.setOrientation applied}
	 * to the {@link #layout}.
	 * @param {Grommunio.core.Context} context The context which fired the event
	 * @param {Grommunio.common.data.ViewModes} newViewMode The new active mode
	 * @param {Grommunio.common.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onViewModeChange: function (context, newViewMode, oldViewMode)
	{
		var orientation;

		switch (newViewMode) {
			case Grommunio.common.data.ViewModes.NO_PREVIEW:
				orientation = Grommunio.common.ui.layout.SwitchBorderLayout.Orientation.OFF;
				break;
			case Grommunio.common.data.ViewModes.RIGHT_PREVIEW:
				orientation = Grommunio.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL;
				// hide the toolbar when right preview panel is enabled.
				this.getSearchResultPreviewPanel().getTopToolbar().onHide();
				break;
			case Grommunio.common.data.ViewModes.BOTTOM_PREVIEW:
				orientation = Grommunio.common.ui.layout.SwitchBorderLayout.Orientation.VERTICAL;
				// show the toolbar when bottom preview panel is enabled and at lest one record
				// is selected in search grid.
				var record = this.model.getPreviewRecord();
				if (Ext.isDefined(record)) {
					this.getSearchResultPreviewPanel().getTopToolbar().onShow();
				}
				break;
			case Grommunio.common.data.ViewModes.SEARCH:
			case Grommunio.common.data.ViewModes.LIVESCROLL:
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

Ext.reg('grommunio.searchcenterpanel', Grommunio.advancesearch.dialogs.SearchCenterPanel);

