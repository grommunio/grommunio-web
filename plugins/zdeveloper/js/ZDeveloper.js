Ext.namespace('Zarafa.plugins.zdeveloper');

/**
 * @class Zarafa.plugins.zdeveloper.ZDeveloperPlugin
 * @extends Zarafa.core.Plugin
 *
 * Shows possible insertion points inside application.
 */
Zarafa.plugins.zdeveloper.ZDeveloperPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initialize the plugin by calling {@link #registerInsertionPoint}.
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.zdeveloper.ZDeveloperPlugin.superclass.initPlugin.apply(this, arguments);

		this.registerInsertionPoint(/(.*?)/, this.putMessageBox, this);
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
	putMessageBox : function(context)
	{
		if (context === 'main.categories') {
			return _('INSERT') + ': ' + context;
		} else if (context.match(/(.*?).tabs/)) {
			return {
				xtype : 'panel',
				title : context,
				listeners : {
					'added' : function() {
						Ext.get(this.tabEl.lastChild).addClass('zdeveloper-insertion-point');
					},
					delay : 1,
					single : true
				}
			};
		} else if (context == 'navigation.center') {
			return {
				xtype: 'zarafa.contextnavigation',
				items : [{
						xtype: 'box',
						autoEl: {
							tag: 'div',
							html: context,
							cls : 'zdeveloper-insertion-point'
						}
					}
				],
				context : container.getCurrentContext()
			};
		} else if (context == 'context.settings.categories') {
			return {
				xtype : 'zarafa.settingscategory',
				title : context,
				iconCls : 'zdeveloper-insertion-point',
				items : []
			};
		} else if (context.match(/(.*?)toolbar(.*?)/) && context !== 'previewpanel.toolbar.detaillinks') {
			return {
				xtype : 'button',
				text : context,
				cls : 'zdeveloper-insertion-point',
				listeners : {
					'render' : function() {
						if (!this.text) {
							// In case the view buttons are expanded
							// rather then placed in a dropdown menu.
							this.setText(Ext.isObject(this.tooltip) ? this.tooltip.title : this.tooltip);
						}
					}
				}
			};
		} else if (context == 'context.mail.gridrow') {
			return String.format('<td style="width: 112px"><div class="{0}">{1}</div></td>', 'grid_compact zdeveloper-insertion-point', 'context.mail.gridrow');
		} else if (context == 'context.mail.griddefaultcolumn' || context == 'context.addressbook.gridpanel') {
			return {
				header : '<p class="zdeveloper-insertion-point">context.mail.griddefaultcolumn</p>',
				width : 200,
				renderer : function(value, p, record) {
					return 'context.mail.griddefaultcolumn';
				},
				tooltip : _('Sort by: context.mail.griddefaultcolumn')
			};
		}
		else if(context != 'main.content') {
			return {
				xtype: 'box',
				autoEl: {
					tag: 'div',
					html: context,
					cls : 'zdeveloper-insertion-point'
				}
			};
		}
	}

});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'zdeveloper',
		displayName : _('ZDeveloper'),
		pluginConstructor : Zarafa.plugins.zdeveloper.ZDeveloperPlugin
	}));
});
