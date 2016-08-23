/*
 * #dependsFile client/zarafa/common/ui/ContextMainPanelToolbar.js
 */
Ext.namespace('Zarafa.mail.ui');

/**
 * @class Zarafa.mail.ui.MailPanelToolbar
 * @extends Zarafa.common.ui.ContextMainPanelToolbar
 * @xtype zarafa.mailpaneltoolbar
 *
 * A panel tool bar for the mail components.
 */
Zarafa.mail.ui.MailPanelToolbar = Ext.extend(Zarafa.common.ui.ContextMainPanelToolbar, {
	/**
	 * Info string which show that out of how many number of mails currently shown in grid.
	 * @property
	 * @type String
	 */
	pageInfoText : _('Loaded {0} of {1}'),

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		// Add an extra tool bar which show how many mails are currently in
		// grid out of total mails. it is required because here we are not show the pagination 
		// information.
		config.paging = config.paging || [];
		config.paging.push({
			xtype: 'tbtext',
			ref: 'loadedMailInfo',
			cls : 'zarafa-loaded-mail-info'
		});
		Zarafa.mail.ui.MailPanelToolbar.superclass.constructor.call(this, config);
	},

	/**
	 * Called when the SearchBox is being resized. This will calculate the new width for the internal
	 * {@link #searchTextField}.
	 * @param {Number} adjWidth The box-adjusted width that was set
	 * @param {Number} adjHeight The box-adjusted height that was set
	 * @param {Number} rawWidth The width that was originally specified
	 * @param {Number} rawHeight The height that was originally specified
	 * @private
	 */
	onResize : function(adjWidth, adjHeight, rawWidth, rawHeight)
	{
		Zarafa.mail.ui.MailPanelToolbar.superclass.onResize.apply(this, arguments);

		// Only resize the searchTextField when the width
		// of this component has been changed.
		if (Ext.isDefined(adjWidth)) {
			this.resizeSearchField();
		}
	},

	/**
	 * Called automatically by superclass. This will initialize the component and also check 
	 * if live scroll enabled then disable pagination.
	 * @private
	 */
	initComponent : function()
	{
		Zarafa.mail.ui.MailPanelToolbar.superclass.initComponent.call(this);

		if(container.getSettingsModel().get('zarafa/v1/contexts/mail/enable_live_scroll')) {
			this.pagesToolbar.setVisible(false);
			if(this.model) {
				this.mon(this.model.getStore(),'load', this.onLoad, this);
			}
		} else {
			this.pagesToolbar.setVisible(true);
			this.pagesToolbar.inputItem.setWidth(30);

			this.pagesToolbar.next.setIconClass('x-tbar-page-next btn-width');
			this.pagesToolbar.next.addClass('btn-margin-right');

			this.pagesToolbar.prev.setIconClass('x-tbar-page-prev btn-width');
			this.pagesToolbar.prev.addClass('btn-margin-right');

			this.pagesToolbar.first.setIconClass('x-tbar-page-first btn-width');
			this.pagesToolbar.first.addClass('btn-margin-right');

			this.pagesToolbar.last.setIconClass('x-tbar-page-last btn-width');
			this.pagesToolbar.last.addClass('btn-margin-right');

			this.loadedMailInfo.setVisible(false);
		}
	},

	/**
	 * Event handler triggers after the layout gets render.
	 * it will set the search text field width dynamically.
	 * @param {Zarafa.common.ui.ContextMainPanelToolbar} toolbar The toolbar which triggers the event.
	 * @param {Ext.Layout} layout The ContainerLayout implementation for this container
	 */
	onAfterLayout : Ext.emptyFn,

	/**
	 * Event handler which trigged whenever {@link Zarafa.core.data.MAPIStore MAPIStore}'s
	 * {@link Zarafa.core.data.MAPIStore#load} is fired, and it will update the pagination
	 * information of grid.
	 * 
	 * @param {Zarafa.core.data.IPMStore} store The store which has loaded
	 * @param {Zarafa.core.data.IPMRecord/Array} records The records which have loaded
	 * @param {Object} options The options object used for loading the store.
	 */
	onLoad : function(store, records, options)
	{
		var total = store.getTotalCount();
		var pageData = store.getRange().length;
		this.loadedMailInfo.setText(String.format(this.pageInfoText, pageData, total));
		this.resizeSearchField();
	},

	/**
	 * Function is used to resize the {@link #searchTextField}. also it will show the 
	 * hidden tool bar items if tool bar container has enough size to show.
	 */
	resizeSearchField : function()
	{
		// Get the width of the container without the padding
		var containerWidth = this.el.getStyleSize().width;
		var pageNavToolbarWidth = 0;
		var copyButtonWidth = 0;
		var deleteButtonWidth = 0;

		/*
		 * TODO: logic for the resize search field is very complex make it easy and optimize.
		 * Check if loadedMailInfo or pagesToolbar is visible then get width of the same,
		 * but if not then get the xtbWidth of loadedMailInfo or pagesToolbar item. show the 
		 * tool bar item if container has enough space available.
		 */
		if (this.loadedMailInfo.isVisible()){
			pageNavToolbarWidth = this.loadedMailInfo.getWidth();
		} else if(this.pagesToolbar.isVisible()) {
			pageNavToolbarWidth = this.pagesToolbar.getWidth();
		} else if(this.loadedMailInfo.xtbHidden) {
			pageNavToolbarWidth = this.loadedMailInfo.xtbWidth;
			if (containerWidth > this.searchTextfield.getWidth() + pageNavToolbarWidth) {
				this.layout.unhideItem(this.loadedMailInfo);
				this.doLayout();
			}
		} else if(this.pagesToolbar.xtbHidden) {
			pageNavToolbarWidth = this.pagesToolbar.xtbWidth;
			if (containerWidth > this.searchTextfield.getWidth() + pageNavToolbarWidth) {
				this.layout.unhideItem(this.pagesToolbar);
				this.doLayout();
			}
		}

		/*
		 * Check if copyButton is visible then get width of the same,
		 * but if not then get the xtbWidth of copyButton item. show the 
		 * tool bar item if container has enough space available.
		 */
		if(this.copyButton.xtbHidden) {
			copyButtonWidth = this.copyButton.xtbWidth;
			if (containerWidth > this.searchTextfield.getWidth() + pageNavToolbarWidth + copyButtonWidth) {
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
			if (containerWidth > this.searchTextfield.getWidth() + pageNavToolbarWidth + copyButtonWidth + deleteButtonWidth) {
				this.layout.unhideItem(this.deleteButton);
				this.doLayout();
			}
		} else {
			deleteButtonWidth = this.deleteButton.getWidth();
		}

		var extraMargin = 0;
		var adjWidth = containerWidth - pageNavToolbarWidth - copyButtonWidth - deleteButtonWidth - extraMargin;
		this.searchTextfield.setWidth(adjWidth);
	}
});

Ext.reg('zarafa.mailpaneltoolbar', Zarafa.mail.ui.MailPanelToolbar);
