/*
 * #dependsFile client/zarafa/mail/ui/MailPanelToolbar.js
 */
Ext.namespace('Zarafa.advancesearch.ui');

/**
 * @class Zarafa.advancesearch.ui.SearchPanelToolbar
 * @extends Zarafa.mail.ui.MailPanelToolbar
 * @xtype zarafa.searchpaneltoolbar
 *
 * A panel tool bar for the advance search components.
 */
Zarafa.advancesearch.ui.SearchPanelToolbar = Ext.extend(Zarafa.mail.ui.MailPanelToolbar, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Zarafa.advancesearch.ui.SearchPanelToolbar.superclass.constructor.call(this, config);
		this.on('afterlayout', this.onAfterLayout, this);
	},

	/**
	 * Event handler triggers after the layout gets render. it will resize the search field
	 * as per the container width.
	 */
	onAfterLayout : function()
	{
		this.resizeSearchField();
	},

	/**
	 * Called automatically by superclass. This will initialize the component and also check 
	 * if live scroll enabled then disable pagination.
	 * @private
	 */
	initComponent : function()
	{
		Zarafa.advancesearch.ui.SearchPanelToolbar.superclass.initComponent.call(this);

		this.pagesToolbar.bindStore(this.model.getStore());

		if(container.getSettingsModel().get('zarafa/v1/contexts/mail/enable_live_scroll')) {
			if(this.model) {
				this.mon(this.model.getStore(),'load', this.onLoad, this);
			}
		}
	}
});

Ext.reg('zarafa.searchpaneltoolbar', Zarafa.advancesearch.ui.SearchPanelToolbar);
