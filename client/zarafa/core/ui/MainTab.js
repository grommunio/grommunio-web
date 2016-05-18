Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.MainTab
 * @extends Ext.Toolbar.Item
 * @xtype zarafa.maintab
 *
 * Is used to render the tabs in the {@link Zarafa.core.ui.MainTabBar MainTabBar}. It will relate to
 * a context and based on what is the active context according to the
 * {@link Zarafa.core.Container Container} it will mark itself as active.
 */
Zarafa.core.ui.MainTab = Ext.extend( Ext.Button, {
	/**
	 * @cfg {String} context Holds the name of the {@link Zarafa.core.Context Context} that this tab is related to.
	 */
	context: null,

	/**
	 * @constructor
	 * @param config Configuration structure
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			// Override from Ext.Component
			xtype: 'zarafa.maintab',
			cls : 'zarafa-maintab',
			buttonActiveCls: 'zarafa-maintabbar-maintab-active',
			handler: this.selectContext
		});

		Zarafa.core.ui.MainTab.superclass.constructor.call(this, config);

		this.mon(container, 'contextswitch', this.onContextSwitch, this);
		this.on('render', this.onRenderButton, this);
	},

	/**
	 * When switching to another context the state of the tab is re-evaluated.
	 * @private
	 */
	onContextSwitch: function(parameters, oldContext, newContext)
	{
		this.setContextActivityState(newContext);
	},

	/**
	 * When the tab is rendered the correct state is set.
	 * @private
	 */
	onRenderButton: function()
	{
		this.setContextActivityState(container.getCurrentContext());
	},

	/**
	 * Set the state of the tab based on the what the currently active context is. It will add the
	 * {@link #buttonActiveCls} as CSS class for the tab that is related to the active context. It
	 * will be removed if the related context is not active.
	 * @param {Zarafa.core.Context} currentContext The current context
	 * @private
	 */
	setContextActivityState: function(currentContext)
	{
		if(this.context == currentContext.getName()){
			this.addClass(this.buttonActiveCls);
		}else{
			this.removeClass(this.buttonActiveCls);
		}
	},


	/**
	 * Selects the context that this tab is related to set by the {@link #context} property. It will
	 * grab the {@link Zarafa.core.ContextModel ContextModel} and retrieve the default folder if the
	 * ContextModel exists. The default folder is opened for that context. The navigation panel is
	 * also just showing the folders related to that context.
	 * @private
	 */
	selectContext: function()
	{
		var context = container.getContextByName(this.context);

		if(context) {
			if(context === container.getCurrentContext()) {
				// if we are loading same context then don't do anything
				return;
			}

			var contextModel = context.getModel();
			var contextFolder;
			if (contextModel) {
				// Try to determine the folders, if previously
				// no folders were selected, we should select
				// the default folder.
				contextFolder = contextModel.getFolders();
				if (Ext.isEmpty(contextFolder)) {
					contextFolder = contextModel.getDefaultFolder();
				}
			}

			container.switchContext(context, contextFolder);
		}
	}
});

Ext.reg('zarafa.maintab', Zarafa.core.ui.MainTab);
