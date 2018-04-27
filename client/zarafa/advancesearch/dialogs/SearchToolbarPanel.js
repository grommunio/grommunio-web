
Ext.namespace('Zarafa.advancesearch.dialogs');

/**
 * @class Zarafa.advancesearch.dialogs.SearchToolbarPanel
 * @extends Ext.Panel
 * @xtype zarafa.searchtoolbarpanel
 *
 */
Zarafa.advancesearch.dialogs.SearchToolbarPanel = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.searchContext)) {
			config.model = config.searchContext.getModel();
		}

		Ext.applyIf(config, {
			xtype : 'zarafa.searchtoolbarpanel',
			layout: 'hbox',
			ref : 'searchToolbar',
			cls : 'k-search-toolbar-panel',
			border : false,
			plugins : [{
				ptype : 'zarafa.recordcomponentplugin',
				enableOpenLoadTask: true,
				autoOpenLoadTaskDefer: 250
			},{
				ptype : 'zarafa.recordcomponentupdaterplugin'
			}],
			height : 35,
			items : [{
				xtype: 'zarafa.searchpaneltoolbar',
				style: 'border-style : none',
				searchText : config.searchText,
				context: config.searchContext
			},{
				xtype : 'zarafa.toolbar',
				style : 'border-style : none; margin-left:5px;',
				cls: 'zarafa-previewpanel-toolbar zarafa-search-previewpanel-toolbar zarafa-context-mainpanel', // change the css class name
				ref : 'rightSearchToolbar',
				hidden : true,
				items : [container.populateInsertionPoint('previewpanel.toolbar.left',  {scope : this, model : config.model}), {
					xtype: 'tbfill'
				},
				container.populateInsertionPoint('previewpanel.toolbar.right.first', {scope : this, model : config.model}),
				{
					xtype: 'button',
					tooltip: _('Reply') + ' (Ctrl + R)',
					overflowText: _('Reply'),
					iconCls: 'icon_replyEmail',
					ref: 'replyBtn',
					responseMode: Zarafa.mail.data.ActionTypes.REPLY,
					handler: this.onResponse,
					scope : this
				},{
					xtype: 'button',
					tooltip: _('Reply All') + ' (Ctrl + Alt + R)',
					overflowText: _('Reply All'),
					iconCls: 'icon_replyAllEmail',
					ref: 'replyAllBtn',
					responseMode: Zarafa.mail.data.ActionTypes.REPLYALL,
					handler: this.onResponse,
					scope : this
				},{
					xtype: 'button',
					tooltip: _('Forward') + ' (Ctrl + F)',
					overflowText: _('Forward'),
					iconCls: 'icon_forwardEmail',
					ref: 'forwardBtn',
					responseMode: Zarafa.mail.data.ActionTypes.FORWARD,
					handler: this.onResponse,
					scope : this
				},{
					xtype: 'button',
					tooltip: _('Edit as New') + ' (Ctrl + E)',
					overflowText: _('Edit as New'),
					iconCls: 'icon_editAsNewEmail',
					ref: 'editAsNewBtn',
					responseMode: Zarafa.mail.data.ActionTypes.EDIT_AS_NEW,
					handler: this.onResponse,
					scope : this
				},container.populateInsertionPoint('previewpanel.toolbar.right', {scope : this, model : config.model})]
			}]
		});

		Zarafa.advancesearch.dialogs.SearchToolbarPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function is used to retrieve {@link Zarafa.common.searchfield.ui.SearchFieldContainer SearchFieldContainer}
	 *
	 * @return {Zarafa.common.searchfield.ui.SearchFieldContainer} Search field container.
	 */
	getSearchFieldContainer : function()
	{
		return this.contextMainPanelToolbar.searchFieldContainer;
	},

	/**
	 * Function is used to retrieve the {@link Zarafa.common.searchfield.ui.SearchTextField SearchTextField}.
	 * @return {Zarafa.common.searchfield.ui.SearchTextField} Search text field.
	 */
	getAdvanceSearchField : function()
	{
		return this.getSearchFieldContainer().searchTextField;
	},

	/**
	 * Function is used to retrieve the {@link Zarafa.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}.
	 * @return {Zarafa.common.searchfield.ui.SearchFolderCombo} Search folder combo
	 */
	getSearchFolderCombo : function()
	{
		return this.getSearchFieldContainer().searchFolderCombo;
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Zarafa.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update : function(record , contentReset)
	{
		this.record = record;
	},

	/**
	 * Function was used to get the right search toolbar.
	 * @returns {Object} return right search tool bar
	 */
	getRightSearchToolbar : function()
	{
		return this.rightSearchToolbar;
	},

	/**
	 * Called when one of the "Reply"/"Reply All"/"Forward"/"Edit as New" menuitems are clicked from
	 * right toolbar of search tool bar.
	 * @param {Ext.Button} button The button which was clicked
	 * @private
	 */
	onResponse : function(button)
	{
		var mailContextModel = container.getContextByName('mail').getModel();
		Zarafa.mail.Actions.openCreateMailResponseContent(this.record, mailContextModel, button.responseMode);
	}
});

Ext.reg('zarafa.searchtoolbarpanel', Zarafa.advancesearch.dialogs.SearchToolbarPanel);

