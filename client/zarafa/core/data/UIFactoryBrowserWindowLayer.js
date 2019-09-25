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

		if ( Ext.isDefined(window.deskappOpenWindow) ){
			// DeskApp needs to open the external window itself because we want to open a new DeskApp window
			// and not a new browser window. So we must check if we are using DeskApp or not. We will do so by
			// checking if the function deskappOpenWindow exists, because this gets injected in WebApp by
			// DeskApp.
			var options = {
				width: config.width || 950,
				height: config.height || 600
			};
			var me = this;
			window.deskappOpenWindow(url, function(separateWindowInstance){
				if ( separateWindowInstance ){
					separateWindowInstance.window.name = uniqueWindowName;
					separateWindowInstance.window.deskappWindow = separateWindowInstance;

					me.registerNewlyCreatedWindow(separateWindowInstance.window, component, config);
				}
			}, options);
		} else {
			// If record is already opened then switch focus to the browser window.
			var browserWindow = Zarafa.core.BrowserWindowMgr.getOpenedWindow(config.record);
			if (browserWindow) {
				browserWindow.focus();
			} else {
				// Create and open a separate browser window.
				var separateWindowInstance = window.open(url, uniqueWindowName, this.getBrowserWindowPosition(config));
				this.registerNewlyCreatedWindow(separateWindowInstance, component, config);
			}
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
	 * The first opened window will be centered over the WebApp main window. The following windows will be stacked
	 * over the previous opened window.
	 *
	 * @param {Object} config A configuration object for the window that should be created. It can contain the
	 * following properties:
	 * - width
	 * - height
	 * - toolbar
	 * - location
	 * - status
	 * - menubar
	 * - scrollbars
	 *
	 * See {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/open} for more information on these
	 * properties.
	 */
	getBrowserWindowPosition : function(config)
	{
		var availableBrowserWindows = Zarafa.core.BrowserWindowMgr.browserWindows;
		var browserWindowHeight = config.width || 600;
		var browserWindowWidth = config.height || 950;
		var left;
		var top;

		if(Ext.isDefined(availableBrowserWindows)) {
			if(availableBrowserWindows.getCount() === 1) {
				var win = availableBrowserWindows.itemAt(0);
				left = win.screenX + (win.outerWidth - browserWindowWidth)/2;
				top = win.screenY + (win.outerHeight - browserWindowHeight)/2;
			} else {
				var lastBrowserWindow = availableBrowserWindows.last();
				left = lastBrowserWindow.screenX;
				top = lastBrowserWindow.screenY;
				left += 30;
				top += 30;
			}
		}

		var toolbar = config.toolbar && config.toolbar !== 'no' ? 'yes' : 'no';
		var location = config.location && config.location !== 'no' ? 'yes' : 'no';
		var status = config.status && config.status !== '0' ? 1 : 0;
		var menubar = config.menubar && config.menubar !== '0' ? 1 : 0;
		var scrollbars = config.scrollbars && config.scrollbars !== '0' ? 1 : 0;
		var resizable = config.resizable && config.resizable !== '0' ? 1 : 0;

		return (
			'toolbar=' + toolbar + ', ' +
			'location=' + location +', ' +
			'status=' + status + ', ' +
			'menubar=' +menubar +', ' +
			'scrollbars=' + scrollbars + ', ' +
			'resizable=' + resizable + ', ' +
			'width=' + browserWindowWidth + ', ' +
			'height=' + browserWindowHeight + ', ' +
			'top=' + top + ', ' +
			'left=' + left
		);
	}
});

Zarafa.core.data.UIFactory.registerLayer(new Zarafa.core.data.UIFactoryBrowserWindowLayer());
