Ext.namespace('Zarafa.common');

/**
 * @class Zarafa.common.CommonViewButtons
 * @extends Ext.menu.Menu
 */
Zarafa.common.CommonViewButtons = Ext.extend(Ext.menu.Menu, {

	/**
	 * @constructor
	 * @param config
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			items : this.createMainToolbarViewButton(config.context)
		});

		Zarafa.common.CommonViewButtons.superclass.constructor.call(this, config);
	},

	/**
	 * Returns the buttons for the dropdown list of the VIEW-button in the main toolbar. It will use the 
	 * main.maintoolbar.view."context name" insertion point to allow other plugins to add their items at the end.
	 * 
	 * @param {context} context the which need to add switch view button in main toolbar.
	 * @return {Ext.Component[]} an array of components
	 */
	createMainToolbarViewButton : function(context) 
	{
		var contextName = context.getName();
		var items = container.populateInsertionPoint('main.maintoolbar.view.'+contextName, this) || [];

		var defaultItems = [{
			id: 'zarafa-maintoolbar-view-'+contextName+'-nopreview',
			overflowText: _('No preview'),
			iconCls: 'icon_previewpanel_off',
			text: _('No preview'),
			valueView : Zarafa.common.data.Views.LIST,
			valueViewMode : Zarafa.common.data.ViewModes.NO_PREVIEW,
			valueDataMode : Zarafa.common.data.DataModes.ALL,
			handler: context.onContextSelectView,
			scope: context
		},{
			id: 'zarafa-maintoolbar-view-'+contextName+'-previewright',
			overflowText: _('Right preview'),
			iconCls: 'icon_previewpanel_right',
			text: _('Right preview'),
			valueView : Zarafa.common.data.Views.LIST,
			valueViewMode : Zarafa.common.data.ViewModes.RIGHT_PREVIEW,
			valueDataMode : Zarafa.common.data.DataModes.ALL,
			handler: context.onContextSelectView,
			scope: context
		},{
			id: 'zarafa-maintoolbar-view-'+contextName+'-previewbottom',
			overflowText: _('Bottom preview'),
			iconCls: 'icon_previewpanel_bottom',
			text: _('Bottom preview'),
			valueView : Zarafa.common.data.Views.LIST,
			valueViewMode : Zarafa.common.data.ViewModes.BOTTOM_PREVIEW,
			valueDataMode : Zarafa.common.data.DataModes.ALL,
			handler: context.onContextSelectView,
			scope: context
		}];

		return defaultItems.concat(items);
	}
});

Ext.reg('zarafa.commonviewbuttons', Zarafa.common.CommonViewButtons);
