Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.UIFactoryBrowserWindowLayer
 * @extends Zarafa.core.data.UIFactoryLayer
 *
 * This layer supports placing {@link Zarafa.core.ui.ContentPanel Content Panels}
 * inside a separate browser window.
 */
Zarafa.core.data.UIFactoryBrowserWindowLayer = Ext.extend(Zarafa.core.data.UIFactoryLayer, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			type : 'separateWindows',
			index : 20,
			plugins : [ 'zarafa.contentlayerplugin' ]
		});

		Zarafa.core.data.UIFactoryBrowserWindowLayer.superclass.constructor.call(this, config);
	},

	/**
	 * The create function which is invoked when a component needs to be added to the Container using
	 * this Layer.
	 * @param {Function} component The constructor of the component which has to be created in the container layer.
	 * @param {Object} config The configuration object which must be
	 * passed to the constructor when creating the component
	 * @protected
	 */
	create : function(component, config)
	{
		// Generate unique name to assign to a separate window, this unique name will be then
		// extensively used by the BrowserWindowMgr
		var uniqueWindowName = Ext.id(null, 'WebApp'+ new Date().getTime());

		var url = container.getBaseURL();
		url = Ext.urlAppend(url, 'load=separate_window');

		// DeskApp needs to open the external window itself because we want to open a new DeskApp window
		// and not a new browser window. So we must check if we are using DeskApp or not. We will do so by
		// checking if the function deskappOpenWindow exists, because this gets injected in WebApp by
		// DeskApp.
		if ( Ext.isDefined(window.deskappOpenWindow) ){
			var me = this;
			window.deskappOpenWindow(url, function(separateWindowInstance){
				if ( separateWindowInstance ){
					separateWindowInstance.window.name = uniqueWindowName;
					separateWindowInstance.window.deskappWindow = separateWindowInstance;

					me.registerNewlyCreatedWindow(separateWindowInstance.window, component, config);
				}
			});
		} else {
			// Create and open a separate browser window.
			var separateWindowInstance = window.open(url, uniqueWindowName, this.getBrowserWindowPosition());
			this.registerNewlyCreatedWindow(separateWindowInstance, component, config);
		}
	},

	/**
	 * A helper function which registers newly created window if we get the instance of the same.
	 * @param {Object} separateWindowInstance Newly created browser window object.
	 * @param {Function} component The constructor of the component which has to be created in the container layer.
	 * @param {Object} config The configuration object which must be
	 * passed to the constructor when creating the component
	 */
	registerNewlyCreatedWindow : function(separateWindowInstance, component, config)
	{
		if (separateWindowInstance) {
			Zarafa.core.BrowserWindowMgr.register(separateWindowInstance, component, config);
		} else {
			// Seems popup is blocked, just remember that it is blocked
			Zarafa.core.BrowserWindowMgr.isPopupsBlocked = true;

			// Keep the inner components and config details of blocked popouts,
			// So that, this can be rendered in case if user manually allows blocked popup windows.
			Zarafa.core.BrowserWindowMgr.blockedPopupsContent.push({
				component: component,
				config: config
			});
		}
	},

	/**
	 * A helper function which prepare a config string dynamically to render popout window properly in a stacked manner.
	 */
	getBrowserWindowPosition : function()
	{
		var separateWindowConfig = '';
		var availableBrowserWindows = Zarafa.core.BrowserWindowMgr.browserWindows;
		var browserWindowHeight = 600;
		var browserWindowWidth = 950;
		var left;
		var top;

		if(Ext.isDefined(availableBrowserWindows)) {
			if(availableBrowserWindows.getCount() === 1) {
				left = (screen.width/2)-(browserWindowWidth/2);
				top = (screen.height/2)-(browserWindowHeight/2);
			} else {
				var lastBrowserWindow = availableBrowserWindows.last();
				left = lastBrowserWindow.screenX;
				top = lastBrowserWindow.screenY;
				left += 30;
				top += 30;
			}
		}

		separateWindowConfig = 'toolbar=no, location=no, status=1, menubar=no, scrollbars=0, resizable=1, width=';
		separateWindowConfig += browserWindowWidth + ', height=' + browserWindowHeight + ', top=' + top + ', left=' + left;
		return separateWindowConfig;
	}
});

Zarafa.core.data.UIFactory.registerLayer(new Zarafa.core.data.UIFactoryBrowserWindowLayer());