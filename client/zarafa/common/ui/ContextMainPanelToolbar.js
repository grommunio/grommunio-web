Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.ContextMainPanelToolbar
 * @extends Ext.Toolbar
 * @xtype zarafa.contextmainpaneltoolbar
 *
 * Main toolbar for all the contexts which contains paging toolbar, foldertitle
 * and some context related menu buttons e.g. copy/move, delete
 */
Zarafa.common.ui.ContextMainPanelToolbar = Ext.extend(Ext.Toolbar, {
	/**
	 * @cfg {Zarafa.core.Context} context The context to which this toolbar belongs
	 */
	context: undefined,
	
	/**
	 * The {@link Zarafa.core.ContextModel} which is obtained from the {@link #context}.
	 * @property
	 * @type Zarafa.mail.MailContextModel
	 */
	model : undefined,

	/**
	 * @cfg {Array} paging Configuration objects of pagination toolbars which should
	 * be added. This can be used if the default pagination toolbar is not sufficient,
	 * and in some situations should be swapped with a different paging toolbar.
	 */
	paging : undefined,

	/**
	 * @cfg {String} defaultTitle The title for the {@link Ext.Panel} Panel
	 */
	defaultTitle: _('Kopano WebApp'),
	
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.context)) {
			config.model = config.context.getModel();
		}

		// Built up the items array
		var items = [];

		items = items.concat({
			xtype : 'zarafa.searchfieldcontainer',
			boxMinWidth: 100,
			ref : 'searchFieldContainer',
			model : config.model
		});

		if (!Ext.isEmpty(config.paging)) {
			items = items.concat(config.paging);
		}

		// We add the default buttons
		items = items.concat([
			'->',
			container.populateInsertionPoint('context.mainpaneltoolbar.item', config.context),
		{
			xtype: 'zarafa.toolbarbutton',
			overflowText : _('Copy/Move'),
			tooltip: _('Copy/Move') + ' (Ctrl + M)',
			iconCls: 'icon_copy',
			ref : 'copyButton',
			nonEmptySelectOnly: true,
			handler: this.onCopyMove,
			model : config.model,
			scope: this
		},{
			xtype: 'zarafa.toolbarbutton',
			overflowText: _('Delete'),
			tooltip: _('Delete'),
			ref : 'deleteButton',
			iconCls: 'icon_delete',
			nonEmptySelectOnly: true,
			handler: this.onDelete,
			model : config.model,
			scope: this
		}]);

		// Add the extra items
		if (!Ext.isEmpty(config.items)) {
			items = items.concat(config.items);
		}

		// Delete config.items as we will override it
		// during Ext.applyIf.
		delete config.items;

		// Update configuration
		Ext.applyIf(config, {
			xtype : 'zarafa.contextmainpaneltoolbar',
			ref : 'contextMainPanelToolbar',
			items : items,
			enableOverflow : true
		});

		Zarafa.common.ui.ContextMainPanelToolbar.superclass.constructor.call(this, config);
		this.initEvent();
	},

	/**
	 * Initialize Events
	 */
	initEvent : function()
	{
		this.on('afterlayout', this.resizeSearchField, this, {delay : 2, single : true});
	},

	/**
	 * Open the {@link Zarafa.common.dialogs.CopyMoveContentPanel CopyMoveContentPanel} for copying
	 * or moving the currently selected folders.
	 * @private
	 */
	onCopyMove : function()
	{
		Zarafa.common.Actions.openCopyMoveContent(this.model.getSelectedRecords());
	},

	/**
	 * Delete the currently selected messages. If any of the records is a recurring item,
	 * then the {@link #Zarafa.common.dialogs.MessageBox.select MessageBox} will be used
	 * to select between the recurring and single appointment.
	 * @private
	 */
	onDelete : function()
	{
		Zarafa.common.Actions.deleteRecords(this.model.getSelectedRecords());
	},

	/**
	 * Open the Print dialog
	 * @private
	 */
	onPrint : function()
	{
		Zarafa.common.Actions.openPrintDialog(this.model.getSelectedRecords());
	},

	/**
	 * Called when the grid is being resized. This will calculate the new width for the internal
	 * {@link #searchTextField}.
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 * @private
	 **/
	onResize : function(adjWidth, adjHeight, rawWidth, rawHeight)
	{
		Zarafa.common.ui.ContextMainPanelToolbar.superclass.onResize.apply(this, arguments);

		// Only resize the searchTextField when the width
		// of this component has been changed.
		var allowResize = this.searchFieldContainer.rendered && this.copyButton.rendered && this.deleteButton.rendered;
		if (Ext.isDefined(adjWidth) && allowResize) {
			this.resizeSearchField();
		}
	},

	/**
	 * Function is used to resize the {@link #searchTextField}. also it will show the
	 * hidden tool bar items if tool bar container has enough size to show.
	 */
	resizeSearchField : function()
	{
		// Get the width of the container without the padding
		var containerWidth = this.el.getStyleSize().width;
		var copyButtonWidth = 0;
		var deleteButtonWidth = 0;
		var filterButtonWidth = 0;

		if(Ext.isDefined(this.filterBtn)) {
			if(this.filterBtn.xtbHidden) {
				filterButtonWidth = this.filterBtn.xtbWidth;
				if (containerWidth > this.searchFieldContainer.getWidth() + filterButtonWidth) {
					this.layout.unhideItem(this.filterBtn);
					// Update the selection of filter split button.
					if (!Ext.isEmpty(this.model)) {
						if (this.model.getStore().hasFilterApplied) {
							this.filterBtn.btnEl.addClass('k-selection');
						}
					}
					this.doLayout();
				}
			} else {
				filterButtonWidth = this.filterBtn.getWidth();
			}
		}

		/*
		 * Check if copyButton is visible then get width of the same,
		 * but if not then get the xtbWidth of copyButton item. show the
		 * tool bar item if container has enough space available.
		 */
		if(this.copyButton.xtbHidden) {
			copyButtonWidth = this.copyButton.xtbWidth;
			if (containerWidth > this.searchFieldContainer.getWidth() + copyButtonWidth) {
				this.layout.unhideItem(this.copyButton);
				this.doLayout();
			}
		} else {
			copyButtonWidth = this.copyButton.getWidth();
		}

		/*
		 * Check if deleteButton is visible then get width of the same,
		 * but if not then get the xtbWidth of deleteButton item. show the
		 * tool bar item if container has enough space available.
		 */
		if(this.deleteButton.xtbHidden) {
			deleteButtonWidth = this.deleteButton.xtbWidth;
			if (containerWidth > this.searchFieldContainer.getWidth() + copyButtonWidth + deleteButtonWidth) {
				this.layout.unhideItem(this.deleteButton);
				this.doLayout();
			}
		} else {
			deleteButtonWidth = this.deleteButton.getWidth();
		}

		var extraMargin = 0;
		var adjWidth = containerWidth - copyButtonWidth - deleteButtonWidth - extraMargin - filterButtonWidth;

		var searchFieldContainer = this.searchFieldContainer;
		var searchField = searchFieldContainer.searchTextField;
		var searchFolderCombo = searchFieldContainer.searchFolderCombo;
		var searchFolderComboWidth = searchFolderCombo.getWidth();
		var searchFolderComboTriggeredWidth = searchFolderCombo.getTriggerWidth();
		var searchBtnWidth = searchFieldContainer.searchBtn.getWidth();

		searchField.setWidth(adjWidth-(searchFolderComboWidth + searchBtnWidth + searchFolderComboTriggeredWidth));
	}
});

Ext.reg('zarafa.contextmainpaneltoolbar', Zarafa.common.ui.ContextMainPanelToolbar);
