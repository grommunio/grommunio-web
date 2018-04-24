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
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};
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

		if(this.pagesToolbar.isVisible()) {
			pageNavToolbarWidth = this.pagesToolbar.getWidth();
		} else if(this.pagesToolbar.xtbHidden) {
			pageNavToolbarWidth = this.pagesToolbar.xtbWidth;
			if (containerWidth > this.searchFieldContainer.getWidth() + pageNavToolbarWidth) {
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
			if (containerWidth > this.searchFieldContainer.getWidth() + pageNavToolbarWidth + copyButtonWidth) {
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
			if (containerWidth > this.searchFieldContainer.getWidth() + pageNavToolbarWidth + copyButtonWidth + deleteButtonWidth) {
				this.layout.unhideItem(this.deleteButton);
				this.doLayout();
			}
		} else {
			deleteButtonWidth = this.deleteButton.getWidth();
		}

		var extraMargin = 0;
		var adjWidth = containerWidth - pageNavToolbarWidth - copyButtonWidth - deleteButtonWidth - extraMargin;

		var searchFieldContainer = this.searchFieldContainer;
		var searchField = searchFieldContainer.searchTextField;
		var searchFolderCombo = searchFieldContainer.searchFolderCombo;
		var searchFolderComboWidth = searchFolderCombo.getWidth();
		var searchFolderComboTriggeredWidth = searchFolderCombo.getTriggerWidth();
		var searchBtnWidth = searchFieldContainer.searchBtn.getWidth();

		searchField.setWidth(adjWidth-(searchFolderComboWidth + searchBtnWidth + searchFolderComboTriggeredWidth));
	}
});

Ext.reg('zarafa.mailpaneltoolbar', Zarafa.mail.ui.MailPanelToolbar);
