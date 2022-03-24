Ext.namespace('Zarafa.plugins.files.ui');

/**
 * @class Zarafa.plugins.files.ui.FilesMainPanel
 * @extends Zarafa.common.ui.ContextMainPanel
 * @xtype filesplugin.filesmainpanel
 */
Zarafa.plugins.files.ui.FilesMainPanel = Ext.extend(Zarafa.common.ui.ContextMainPanel, {

	/**
	 * @constructor
	 * @param {Object} config
	 */
	constructor: function (config) {
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'filesplugin.filesmainpanel',
			layout: 'zarafa.switchborder',
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

		Zarafa.plugins.files.ui.FilesMainPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Initializes the different views for the files plugin.
	 *
	 * @param {Object} config Configuration object
	 * @return {Zarafa.mail.ui.MailGrid}
	 * @private
	 */
	initMainItems: function (config)
	{
		return {
			xtype : 'panel',
			layout : 'zarafa.collapsible',
			cls : 'zarafa-files-context-mainpanel',
			minWidth : 200,
			minHeight : 200,
			region : 'center',
			border: false,
			split : true,
			items : [{
				xtype : 'zarafa.switchviewcontentcontainer',
				ref : '../viewPanel',
				layout   : 'card',
				lazyItems: this.initViews(config.context)
			}],
			tbar : {
				xtype       : 'filesplugin.fileslisttoolbar',
				defaultTitle: dgettext('plugin_files', 'Files'),
				height      : 33,
				context     : config.context
			}
		};
	},

	/**
	 * Function will initialize all views associated with files context
	 * it will also get views added through 3rd party plugins and add it here
	 * @param {Zarafa.plugins.files.FilesContext} context The Files Context
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
	 * Initializes the {@link Zarafa.plugins.files.ui.FilesPreviewPanel PreviewPanel}
	 *
	 * @return {Zarafa.plugins.files.ui.FilesPreviewPanel}
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

		Zarafa.plugins.files.ui.FilesMainPanel.superclass.initEvents.apply(this, arguments);
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
		var store = context.getModel().getStore();
		switch (newView) {
			case Zarafa.plugins.files.data.Views.LIST:
				this.viewPanel.switchView(store.getPath() === "#R#" ? 'files-accountview' : 'files-gridview');
				break;
			case Zarafa.plugins.files.data.Views.ICON:
				this.viewPanel.switchView('files-iconview');
				break;
		}
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.core.Context} fires the
	 * {@link Zarafa.core.Context#viewmodechange viewmodechange} event. This will
	 * convert the configured {@link Zarafa.common.data.ViewModes mode} to a
	 * {@link Zarafa.common.ui.layout.SwitchBorderLayout.Orientation orientation}
	 * to be {@link Zarafa.common.ui.layout.SwitchBorderLayout.setOrientation applied}
	 * to the {@link #layout}.
	 *
	 * @param {Zarafa.core.Context} context The context which fired the event
	 * @param {Zarafa.common.data.ViewModes} newViewMode The new active mode
	 * @param {Zarafa.common.data.ViewModes} oldViewMode The previous mode
	 * @private
	 */
	onViewModeChange: function (context, newViewMode, oldViewMode)
	{
		var orientation;

		switch (newViewMode) {
			case Zarafa.plugins.files.data.ViewModes.NO_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.OFF;
				break;
			case Zarafa.plugins.files.data.ViewModes.RIGHT_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.HORIZONTAL;
				break;
			case Zarafa.plugins.files.data.ViewModes.BOTTOM_PREVIEW:
				orientation = Zarafa.common.ui.layout.SwitchBorderLayout.Orientation.VERTICAL;
				break;
			case Zarafa.plugins.files.data.ViewModes.SEARCH:
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

Ext.reg('filesplugin.filesmainpanel', Zarafa.plugins.files.ui.FilesMainPanel);
