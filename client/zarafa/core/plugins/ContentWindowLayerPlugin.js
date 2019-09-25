Ext.namespace('Zarafa.core.plugins');

/**
 * @class Zarafa.core.plugins.ContentWindowLayerPlugin
 * @extends Zarafa.core.plugins.ContentLayerPlugin
 * @ptype zarafa.contentwindowlayerplugin
 *
 * Implementation of the {@link Zarafa.core.plugins.ContentLayerPlugin ConentLayerPlugin}
 * which supports placing the {@link Zarafa.core.ui.ContentPanel Content Panel} inside a
 * {@link Ext.Window Window}.
 */
Zarafa.core.plugins.ContentWindowLayerPlugin = Ext.extend(Zarafa.core.plugins.ContentLayerPlugin, {
	/**
	 * The {@link Ext.Window Window} object on which the {@link #field} has been installed.
	 * @property
	 * @type Ext.Window
	 * @protected
	 */
	win : undefined,

	/**
	 * @cfg {Array} windowRelays The list of event names which should be {@link Zarafa.core.ui.ContentPanel#relayEvents relayed}
	 * from the {@link #win}. Defaults to 'beforeshow', 'show', 'beforehide' and 'hide'.
	 */
	windowRelays : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			windowRelays : ['beforeshow', 'show', 'beforehide', 'hide']
		});

		Zarafa.core.plugins.ContentWindowLayerPlugin.superclass.constructor.call(this, config);
	},
	
	/**
	 * This is called after {@link #init} when the {@link #field} has been fully initialized,
	 * and the owner of the component is known. This allows the plugin to access the parent.
	 *
	 * @protected
	 */
	initPlugin : function()
	{
		this.win = this.field.findParentByType('window');

		// The Ext.Window itself is not stateful; however, each call to saveState
		// in the window should be redirected to the ContentPanel contained by it
		this.win.saveState = function() { this.field.saveState(); }.createDelegate(this);

		// Relay events from this.win as if they were fired by this
		// The aim is to go full cycle through the panel - e.g. when closing we normally want the panel to initiate the close
		this.field.relayEvents(this.win, this.windowRelays);

		Zarafa.core.plugins.ContentWindowLayerPlugin.superclass.initPlugin.apply(this, arguments);

		this.win.on('render', this.applyTooltip);
	},
	
	/**
	 * This will apply tooltip on close button ('X') of (@link Ext.Window Window).
	 */
	applyTooltip : function()
	{
		var el = this.el;
		var closeTab = Ext.get(el).child('.x-tool-close', true);
		if(closeTab) {
			closeTab.qtip =  _('Close') + ' (Ctrl + Alt + W)';
		}
	},

	/**
	 * This will apply the required title onto the {@link #win Window}
	 *
	 * @param {String} title The title to apply
	 * @protected
	 */
	setTitle : function(title)
	{
		this.win.setTitle(Ext.util.Format.htmlEncode(title));
	},

	/**
	 * Handler for hiding this layer
	 *
	 * This plugin contains an {@link #win Ext.Window}, which is hidden by calling win.hide
	 * @protected
	 */
	hide : function()
	{
		this.win.hide();
	},

	/**
	 * Handler for closing this layer
	 *
	 * This plugin contains an {@link #win Ext.Window}, which is closed by calling win.close
	 * @protected
	 */
	close : function()
	{
		this.win.close();
	},

	/**
	 * This will bring focus to the Container by bringing it to the attention
	 * of the user by {@link Ext.WindowMgr#bringToFront moving the dialog to the top}
	 * @protected
	 */
	focus : function()
	{
		(this.win.manager || Ext.WindowMgr).bringToFront(this.win);
	}
});

Ext.preg('zarafa.contentwindowlayerplugin', Zarafa.core.plugins.ContentWindowLayerPlugin);
