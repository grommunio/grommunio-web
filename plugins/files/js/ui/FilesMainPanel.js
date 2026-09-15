/*
 * SPDX-FileCopyrightText: Copyright 2020 - 2026 grommunio GmbH
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

Ext.namespace('Grommunio.plugins.files.ui');

/**
 * @class Grommunio.plugins.files.ui.FilesMainPanel
 * @extends Grommunio.common.ui.ContextMainPanel
 * @xtype filesplugin.filesmainpanel
 */
Grommunio.plugins.files.ui.FilesMainPanel = Ext.extend(Grommunio.common.ui.ContextMainPanel, {

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'filesplugin.filesmainpanel',
			layout: 'grommunio.switchborder',
			header : false,
			iconCls : 'icon_files',
			items: [
				this.initMainItems(config),
				this.initPreviewPanel()
			],
			tbar       : {
				xtype: 'filesplugin.filestoptoolbar',
				height      : 28,
				context     : config.context
			}
		});

		Grommunio.plugins.files.ui.FilesMainPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the different views for the files plugin.
	 *
	 * @param {Object} config Configuration object
	 * @return {Grommunio.mail.ui.MailGrid}
	 * @private
	 */
	initMainItems: function (config)
	{
		return {
			xtype : 'panel',
			layout : 'grommunio.collapsible',
			cls : 'grommunio-files-context-mainpanel',
			minWidth : 200,
			minHeight : 200,
			region : 'center',
			border: false,
			split : true,
			items : [{
				xtype : 'grommunio.switchviewcontentcontainer',
				ref : '../viewPanel',
				layout   : 'card',
				lazyItems: this.initViews(config.context)
			}],
			tbar : {
				xtype       : 'filesplugin.fileslisttoolbar',
				defaultTitle: _('Files'),
				height      : 38,
				context     : config.context
			}
		};
	},

	/**
	 * Function will initialize all views associated with files context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Grommunio.plugins.files.FilesContext} context The Files Context
	 * @return {Array} array of config objects of different views
	 * @private
	 */
	initViews: function (context)
	{
		var allViews = [{
			xtype  : 'filesplugin.filesrecordaccountview',
			flex   : 1,
			id     : 'files-accountview',
			anchor : '100%',
			context: context
		}, {
			xtype  : 'filesplugin.filesrecordgridview',
			flex   : 1,
			id     : 'files-gridview',
			anchor : '100%',
			context: context
		}, {
			xtype  : 'filesplugin.filesrecordiconview',
			flex   : 1,
			id     : 'files-iconview',
			anchor : '100%',
			context: context
		}];

		var additionalViewItems = container.populateInsertionPoint('plugin.files.views', this, context);
		allViews = allViews.concat(additionalViewItems);

		return allViews;
	},

	/**
	 * Initializes the {@link Grommunio.plugins.files.ui.FilesPreviewPanel PreviewPanel}
	 *
	 * @return {Grommunio.plugins.files.ui.FilesPreviewPanel}
	 * @private
	 */
	initPreviewPanel: function() {
		return {
			xtype  : 'filesplugin.filespreviewpanel',
			ref    : 'filesPreview',
			border : false,
			region : 'south',
			split  : true
		};
	},

	/**
	 * Called during rendering of the panel, this will initialize all events.
	 * @private
	 */
	initEvents: function () {
		if (Ext.isDefined(this.context)) {
			this.mon(this.context, 'viewchange', this.onViewChange, this);
			this.mon(this.context, 'viewmodechange', this.onViewModeChange, this);

			this.onViewChange(this.context, this.context.getCurrentView());
			this.onViewModeChange(this.context, this.context.getCurrentViewMode());
		}

		Grommunio.plugins.files.ui.FilesMainPanel.superclass.initEvents.apply(this, arguments);
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
		var store = context.getModel().getStore();
		switch (newView) {
			case Grommunio.plugins.files.data.Views.LIST:
				this.viewPanel.switchView(store.getPath() === "#R#" ? 'files-accountview' : 'files-gridview');
				break;
			case Grommunio.plugins.files.data.Views.ICON:
				this.viewPanel.switchView('files-iconview');
				break;
		}
	},

	/**
	 * Event handler which is fired when the {@link Grommunio.core.Context} fires the
	 * {@link Grommunio.core.Context#viewmodechange viewmodechange} event. This will
	 * convert the configured {@link Grommunio.common.data.ViewModes mode} to a
	 * {@link Grommunio.common.ui.layout.SwitchBorderLayout.Orientation orientation}
	 * to be {@link Grommunio.common.ui.layout.SwitchBorderLayout.setOrientation applied}
	 * to the {@link #layout}.
	 *
	 * @param {Grommunio.core.Context} context The context which fired the event
	 * @param {Grommunio.common.data.ViewModes} newViewMode The new active mode
	 * @param {Grommunio.common.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onViewModeChange: function (context, newViewMode, oldViewMode)
	{
		var orientation;

		switch (newViewMode) {
			case Grommunio.plugins.files.data.ViewModes.NO_PREVIEW:
				orientation = Grommunio.common.ui.layout.SwitchBorderLayout.Orientation.OFF;
				break;
			case Grommunio.plugins.files.data.ViewModes.RIGHT_PREVIEW:
				orientation = Grommunio.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL;
				break;
			case Grommunio.plugins.files.data.ViewModes.BOTTOM_PREVIEW:
				orientation = Grommunio.common.ui.layout.SwitchBorderLayout.Orientation.VERTICAL;
				break;
			case Grommunio.plugins.files.data.ViewModes.SEARCH:
				return;
		}

		var layout = this.getLayout();
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

Ext.reg('filesplugin.filesmainpanel', Grommunio.plugins.files.ui.FilesMainPanel);
