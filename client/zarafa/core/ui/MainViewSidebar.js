Ext.namespace('Zarafa.core.ui');

/**
 * @class Zarafa.core.ui.MainViewSidebar
 * @extends Ext.Panel
 * @xtype mainviewsidebar
 *
 * The sidebars for the {@link Zarafa.core.ui.MainViewport Main Viewport}
 * which support {@link #collapse collapsing} and {@link #stateful}.
 */
Zarafa.core.ui.MainViewSidebar = Ext.extend(Ext.Panel, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.plugins = Ext.value(config.plugins, []);

		Ext.applyIf(config, {
			cls : 'zarafa-context-mainpanel',
			border : false,
			collapsible : true,
			collapsed : false,
			split : true,
			width : 242,
			minSize : 150
		});

		Zarafa.core.ui.MainViewSidebar.superclass.constructor.call(this, config);
	},

	/**
	 * Obtain the path in which the {@link #getState state} must be saved.
	 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
	 * used in the {@link Ext.state.Manager}. This returns {@link #statefulName} if provided, or else generates
	 * a custom name.
	 * @return {String} The unique name for this component by which the {@link #getState state} must be saved. 
	 */
	getStateName : function()
	{
		return 'sidebars/' + Zarafa.core.ui.MainViewSidebar.superclass.getStateName.call(this);
	}
});

Ext.reg('mainviewsidebar', Zarafa.core.ui.MainViewSidebar);
