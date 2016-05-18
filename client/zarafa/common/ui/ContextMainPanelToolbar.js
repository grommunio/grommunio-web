Ext.namespace('Zarafa.calendar.ui');

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
			xtype : 'zarafa.searchfield',
			boxMinWidth: 100,
			ref : 'searchTextfield',
			listeners: {
				render : function(field){
					this.onModelFolderChange(this.model);
				},
				scope : this
			}
		});

		if (!Ext.isEmpty(config.paging)) {
			items = items.concat(config.paging);
		}

		// Then we add all pagination toolbars which are registered,
		// and we add our own default pagination toolbar.
		items.push({
			xtype: 'zarafa.paging',
			style : 'border-style : none',
			ref : 'pagesToolbar',
			pageSize : container.getSettingsModel().get('zarafa/v1/main/page_size'),
			store : config.model ? config.model.getStore() : undefined
		});

		// We add the default buttons
		items = items.concat([
			'->', 
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
			tooltip: _('Delete') + ' (DELETE)',
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
		this.on('afterlayout', this.onAfterLayout, this, {delay : 2});

		this.mon(this.model, {
			folderchange : this.onModelFolderChange,
			scope : this
		});
	},

	/**
	 * Event handler which will be called when the {@link #model} fires the
	 * {@link Zarafa.core.ContextModel#folderchange} event. This will determine
	 * if the selected folders support 'search folders' and update the UI accordingly.
	 * @param {Zarafa.core.ContextModel} model this context model.
	 * @param {Array} folders selected folders as an array of {Zarafa.hierarchy.data.MAPIFolderRecord Folder} objects.
	 * @private
	 */
	onModelFolderChange : function(model, folders)
	{
		var folder = model.getDefaultFolder();
		var emptyText = this.searchTextfield.getEmptySearchText(folder);
		this.searchTextfield.setEmptyText(emptyText);
	},

	/**
	 * Event handler triggers after the layout gets render.
	 * it will set the search text field width dynamically.
	 * @param {Zarafa.common.ui.ContextMainPanelToolbar} toolbar The toolbar which triggers the event.
	 * @param {Ext.Layout} layout The ContainerLayout implementation for this container
	 */
	onAfterLayout : function(toolbar, layout)
	{
		var width = this.getWidth();

		var itemWidth = 0;
		Ext.each(toolbar.items.items, function(item, index, array){
			if(!item.isXType('zarafa.searchfield') && item.rendered) {
				if(item.isVisible()) {
					itemWidth += item.getWidth();
				} else if(Ext.isDefined(item.xtbHidden) && item.xtbHidden) {
					itemWidth += item.xtbWidth;
				}
			}
		}, this);

		if(width > itemWidth) {
			Ext.each(toolbar.items.items, function(item, index, array){
				if(!item.isVisible() && Ext.isDefined(item.xtbHidden) && item.xtbHidden) {
					layout.unhideItem(item);
				}
			}, this);
		}

		toolbar.searchTextfield.setWidth(width - (itemWidth));
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
	}
});

Ext.reg('zarafa.contextmainpaneltoolbar', Zarafa.common.ui.ContextMainPanelToolbar);
