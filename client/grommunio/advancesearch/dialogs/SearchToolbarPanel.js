
Ext.namespace('Grommunio.advancesearch.dialogs');

/**
 * @class Grommunio.advancesearch.dialogs.SearchToolbarPanel
 * @extends Ext.Panel
 * @xtype grommunio.searchtoolbarpanel
 *
 */
Grommunio.advancesearch.dialogs.SearchToolbarPanel = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object.
	 */
	constructor: function(config)
	{
		config = config || {};

		if (!Ext.isDefined(config.model) && Ext.isDefined(config.searchContext)) {
			config.model = config.searchContext.getModel();
		}

		Ext.applyIf(config, {
			xtype: 'grommunio.searchtoolbarpanel',
			layout: 'auto',
			ref: 'searchToolbar',
			cls: 'k-search-toolbar-panel',
			border: false,
			plugins: [{
				ptype: 'grommunio.recordcomponentplugin',
				enableOpenLoadTask: false
			},{
				ptype: 'grommunio.recordcomponentupdaterplugin'
			}],
			autoHeight: true,
			items: [{
				xtype: 'grommunio.contextmainpaneltoolbar',
				style: 'border-style: none',
				searchText: config.searchText,
				context: config.searchContext
			},{
				xtype: 'grommunio.toolbar',
				style: 'border-style: none; margin-left:5px;',
				cls: 'grommunio-previewpanel-toolbar grommunio-search-previewpanel-toolbar grommunio-context-mainpanel', // change the css class name
				ref: 'rightSearchToolbar',
				hidden: true,
				items: [container.populateInsertionPoint('previewpanel.toolbar.left', {scope: this, model: config.model}),
				{
					xtype: 'button',
					tooltip: _('Reply') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + R', false),
					overflowText: _('Reply'),
					text: _('Reply'),
					iconCls: 'icon_reply',
					ref: 'replyBtn',
					responseMode: Grommunio.mail.data.ActionTypes.REPLY,
					handler: this.onResponse,
					scope: this
				},{
					xtype: 'button',
					tooltip: _('Reply All') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + Alt + R', false),
					overflowText: _('Reply All'),
					text: _('Reply All'),
					iconCls: 'icon_reply_all',
					ref: 'replyAllBtn',
					responseMode: Grommunio.mail.data.ActionTypes.REPLYALL,
					handler: this.onResponse,
					scope: this
				},{
					xtype: 'button',
					tooltip: _('Forward') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + F', false),
					overflowText: _('Forward'),
					text: _('Forward'),
					iconCls: 'icon_forward',
					ref: 'forwardBtn',
					responseMode: Grommunio.mail.data.ActionTypes.FORWARD,
					handler: this.onResponse,
					scope: this
				},{
					xtype: 'tbfill'
				},
				container.populateInsertionPoint('previewpanel.toolbar.right.first', {scope: this, model: config.model}),
				{
					xtype: 'button',
					tooltip: _('Edit as New') + Grommunio.core.KeyMapMgr.formatShortcutHint('Ctrl + E', false),
					overflowText: _('Edit as New'),
					iconCls: 'icon_edit_as_new_mail',
					ref: 'editAsNewBtn',
					responseMode: Grommunio.mail.data.ActionTypes.EDIT_AS_NEW,
					handler: this.onResponse,
					scope: this
				},container.populateInsertionPoint('previewpanel.toolbar.right', {scope: this, model: config.model})]
			}]
		});

		Grommunio.advancesearch.dialogs.SearchToolbarPanel.superclass.constructor.call(this, config);
	},

	/**
	 * Function is used to retrieve {@link Grommunio.common.searchfield.ui.SearchFieldContainer SearchFieldContainer}
	 *
	 * @return {Grommunio.common.searchfield.ui.SearchFieldContainer} Search field container.
	 */
	getSearchFieldContainer: function()
	{
		return this.contextMainPanelToolbar.searchFieldContainer;
	},

	/**
	 * Function is used to retrieve the {@link Grommunio.common.searchfield.ui.SearchTextField SearchTextField}.
	 * @return {Grommunio.common.searchfield.ui.SearchTextField} Search text field.
	 */
	getAdvanceSearchField: function()
	{
		return this.getSearchFieldContainer().searchTextField;
	},

	/**
	 * Function is used to retrieve the {@link Grommunio.common.searchfield.ui.SearchFolderCombo SearchFolderCombo}.
	 * @return {Grommunio.common.searchfield.ui.SearchFolderCombo} Search folder combo
	 */
	getSearchFolderCombo: function()
	{
		return this.getSearchFieldContainer().searchFolderCombo;
	},

	/**
	 * Update the components with the given record.
	 *
	 * @param {Grommunio.core.data.MAPIRecord} record The record to update in this component
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @private
	 */
	update: function(record , contentReset)
	{
		this.record = record;
	},

	/**
	 * Function was used to get the right search toolbar.
	 * @returns {Object} return right search tool bar
	 */
	getRightSearchToolbar: function()
	{
		return this.rightSearchToolbar;
	},

	/**
	 * Called when one of the "Reply"/"Reply All"/"Forward"/"Edit as New" menuitems are clicked from
	 * right toolbar of search tool bar.
	 * @param {Ext.Button} button The button which was clicked
	 * @private
	 */
	onResponse: function(button)
	{
		var mailContextModel = container.getContextByName('mail').getModel();
		Grommunio.mail.Actions.openCreateMailResponseContent(this.record, mailContextModel, button.responseMode);
	}
});

Ext.reg('grommunio.searchtoolbarpanel', Grommunio.advancesearch.dialogs.SearchToolbarPanel);

