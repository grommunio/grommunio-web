Ext.namespace('Zarafa.common.plugins');

/**
 * @class Zarafa.common.plugins.ZDeveloperPlugin
 * @extends Zarafa.core.Plugin
 *
 * Shows possible insertion points inside application.
 */
Zarafa.common.plugins.ZDeveloperPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initialize the plugin by calling {@link #registerInsertionPoint}.
	 * @protected
	 */
	initPlugin: function()
	{
		Zarafa.common.plugins.ZDeveloperPlugin.superclass.initPlugin.apply(this, arguments);

		var isAdvancedSettingsEnabled = container.getServerConfig().isAdvancedSettingsEnabled();
		if (container.getSettingsModel().get("zarafa/v1/main/kdeveloper_tool/kdeveloper") === true && isAdvancedSettingsEnabled === true)  {
			this.registerInsertionPoint(/(.*?)/, this.putMessageBox, this);
		}

		// Registrate the item data button when the setting is enabled and when advanced settings is enabled
		if (container.getSettingsModel().get('zarafa/v1/main/kdeveloper_tool/itemdata') === true && isAdvancedSettingsEnabled === true) {
			this.registerInsertionPoint('context.mail.contextmenu.options', this.itemdatabutton, this);
		}
	},

	/**
	 * Create item data button
	 */
	itemdatabutton: function () {
		return [{
			xtype: 'zarafa.conditionalitem',
			text: _('Item data'),
			iconCls: 'icon_cogwheel',
			singleSelectOnly: true,
			handler: this.onClickItemDataHandler,
			scope: this
		}];
	},

	/**
	 * Event handler which is called when the user clicks the 'Item data'
	 * item in the context menu. This will open a new window with item details.
	 * @private
	 */
	onClickItemDataHandler: function (btn) {
		var popUp = window.open("", "",'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=1000,height=900');
		popUp.document.write("<pre style=word-wrap:break-word;white-space:pre-line;>"+JSON.stringify(btn.parentMenu.records[0].data, undefined, 2)+"</pre>");
	},

	/**
	 * Return the message box with the name of insertion point.
	 *
	 * WARNING: The objects returned by this function do not represent the actual
	 * objects which are expected by the callers of the insertion point. The returned
	 * objects only ensure that "Something" is shown at the correct location as reference
	 * to the plugin developers where the particular insertion point might appear.
	 * For returning the correct object for an insertion point, please refer to the API
	 * documentation for that particular insertion point.
	 *
	 * @param context
	 * @return {Object}
	 */
	putMessageBox: function(context)
	{
		if (context === 'main.categories') {
			return _('INSERT') + ': ' + context;
		} else if (context.match(/(.*?).tabs/)) {
			return {
				xtype: 'panel',
				title: context,
				listeners: {
					'added': function() {
						Ext.get(this.tabEl.lastChild).addClass('k-developer-insertion-point');
					},
					delay: 1,
					single: true
				}
			};
		} else if (context === 'navigation.center') {
			return {
				xtype: 'zarafa.contextnavigation',
				items: [{
						xtype: 'box',
						autoEl: {
							tag: 'span',
							html: context,
							cls: 'k-developer-insertion-point'
						}
					}
				],
				context: container.getCurrentContext()
			};
		} else if (context === 'context.settings.categories') {
			return {
				xtype: 'zarafa.settingscategory',
				title: context,
				iconCls: 'k-developer-insertion-point',
				items: []
			};
		} else if (context.match(/(.*?)toolbar(.*?)/) && context !== 'previewpanel.toolbar.detaillinks') {
			return {
				xtype: 'button',
				text: context,
				cls: 'k-developer-insertion-point',
				listeners: {
					'render': function() {
						if (!this.text) {
							// In case the view buttons are expanded
							// rather then placed in a dropdown menu.
							this.setText(Ext.isObject(this.tooltip) ? this.tooltip.title : this.tooltip);
						}
					}
				}
			};
		} else if (context === 'context.mail.gridrow') {
			return String.format('<td style="width: 112px"><div class="{0}">{1}</div></td>', 'grid_compact k-developer-insertion-point', 'context.mail.gridrow');
		} else if (context === 'context.mail.griddefaultcolumn' || context === 'context.addressbook.gridpanel') {
			return {
				header: '<p class="k-developer-insertion-point">context.mail.griddefaultcolumn</p>',
				width: 200,
				renderer: function(value, p, record) {
					return 'context.mail.griddefaultcolumn';
				},
				tooltip: _('Sort by: context.mail.griddefaultcolumn')
			};
		}
		else if(context !== 'main.content') {
			return {
				xtype: 'box',
				autoEl: {
					tag: 'div',
					html: context,
					cls: 'k-developer-insertion-point'
				}
			};
		}
	}

});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name: 'zdeveloper',
		allowUserDisable: false,
		allowUserVisible: false,
		displayName: _('ZDeveloper'),
		pluginConstructor: Zarafa.common.plugins.ZDeveloperPlugin
	}));
});
