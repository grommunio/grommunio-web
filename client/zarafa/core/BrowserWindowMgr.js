Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.BrowserWindowMgr
 * @extends Ext.util.Observable
 *
 * The global Browser-window manager that will keep track of all the available browser windows with
 * a unique key assigned to each of the browser window as its name.
 * @singleton
 */
Zarafa.core.BrowserWindowMgr = Ext.extend(Ext.util.Observable, {
	/**
	 * The list of registered browser window. It contains the list with the window DOM object bound to a
	 * unique key.
	 * @property
	 * @type Ext.util.MixedCollection
	 * @private
	 */
	browserWindows : undefined,

	/**
	 * The key of registered browser window which is active currently.
	 * @property
	 * @type String
	 * @private
	 */
	activeBrowserWindow : undefined,

	/**
	 * The list of registered browser window with the object which contain,
	 * component The constructor of the component which has to be created in the container layer and
	 * config which must be passed to the constructor when creating the component.
	 * @property
	 * @type Ext.util.MixedCollection
	 * @private
	 */
	browserWindowComponents : undefined,

	/**
	 * Denotes that the multiple popups are blocked by the browser or not.
	 * @property
	 * @type Boolean
	 * @private
	 */
	isPopupsBlocked : false,

	/**
	 * An array which contain, component The constructor of the component which has to be created in the container layer and
	 * config which must be passed to the constructor when creating the component,
	 * for the popup window which was blocked by the browser.
	 * @property
	 * @type Array
	 * @private
	 */
	blockedPopupsContent : [],

	/**
	 * @constructor
	 */
	constructor : function()
	{
		this.browserWindows = new Ext.util.MixedCollection();

		// It is required to manage multiple browser windows when first separate window is created by user.
		// So, we must have to register the main webapp-browser-window to the BrowserWindowMgr.
		window.name = 'mainBrowserWindow';
		this.register(window);
		window.addEventListener("focus", function(event) {
			Zarafa.core.BrowserWindowMgr.setActive('mainBrowserWindow');
		}, false);
		this.browserWindowComponents = new Ext.util.MixedCollection();

		this.addEvents('separatewindowresize');
	},

	/**
	 * Register component and config which will use to re create separate window ui on reload or refresh
	 * @param {String} uniqueWindowName unique name of browser window
	 * @param {Function} component The constructor of the component which has to be created in the container layer.
	 * @param {Object} config The configuration object which must be
	 */
	initComponent: function (uniqueWindowName, component, config)
	{
		this.browserWindowComponents.add(uniqueWindowName, {
			component: component,
			config: config
		});
	},


	/**
	 * Helper function which registers necessary events. This happens mostly when anew browser window
	 * gets loaded for the first time.
	 *
	 * @param {Object} browserWindowObject The newly created window object which must be registered.
	 * @param {Ext.Component} componentInstance component which is required to be rendered into the separate browser window.
	 * @param {Ext.Container} mainContainer The container which is the parent most container of separate window.
	 * @private
	 */
	initEvents : function(browserWindowObject, componentInstance, mainContainer)
	{
		// Initialize ext doc classes on separate window.
		this.initExtCss(browserWindowObject);

		componentInstance.on('close', this.onSeparateWindowClose.createDelegate(this, [ browserWindowObject ]));

		// Check the record has unsaved user changes before popout
		// If true then update the record component plugin value
		if(componentInstance.isRecordChangeByUser){
			componentInstance.on('userupdaterecord', this.onComponentUserupdateRecord.createDelegate(this, [ componentInstance ], true));
		}

		Ext.EventManager.on(
			browserWindowObject,
			"resize",
			this.onSeparateWindowResize.createDelegate(this, [ browserWindowObject, mainContainer ]),
			browserWindowObject
		);


		// Initialize events which are use to handle drag and drop in separate window.
		Ext.dd.DragDropMgr.initEvents(browserWindowObject);

		browserWindowObject.addEventListener("focus", this.onSeparateWindowFocus.createDelegate(this, [ browserWindowObject.name ]));
		browserWindowObject.addEventListener("unload", this.onSeparateWindowUnload.createDelegate(this, [ browserWindowObject, componentInstance, mainContainer ]));

		// Disable contextmenu globaly in the separate browser window.
		Ext.getBody().on('contextmenu', this.onBodyContextMenu, this);

		// Check component instance has before unload event handler if yes then
		// Register event handler for separate window onbeforeunload event
		// which is use to show a confirmation dialog warning if window record has any unsaved changes
		if (Ext.isFunction(componentInstance.onBeforeUnload)) {
			browserWindowObject.onbeforeunload = componentInstance.onBeforeUnload.createDelegate(componentInstance);
		}
	},

	/**
	 * Event handler for the {@link Zarafa.core.plugins.RecordComponentPlugin#userupdaterecord userupdaterecord} event
	 * on the {@link #field}. This will relay the value of {@link Zarafa.core.plugins.RecordComponentPlugin#isChangedByUser} config option.
	 * to the newly created content panel into popout window.
	 * It is required to persist the user change state into RecordComponentPlugin for this particular field.
	 * @param {Ext.Component} field The component which fired the event
	 * @param {Zarafa.core.data.MAPIRecord} record The record which was updated
	 * @param {Boolean} isChangedByUser Indicates if the record has been changed by the user since it has been loaded.
	 * @param {Ext.Component} componentInstance component which gets rendered into the separate browser window.
	 * @private
	 */
	onComponentUserupdateRecord : function(field, record, isChangedByUser, componentInstance)
	{
		field.recordComponentPlugin.isChangedByUser = componentInstance.isRecordChangeByUser;
	},

	/**
	 * Register a newly created browser-window object with the {@link Zarafa.core.BrowserWindowMgr BrowserWindowMgr}.
	 * @param {Object} browserWindowObject The newly created window object which must be registered.
	 * @param {Function} component The constructor of the component which has to be created in the container layer.
	 * @param {Object} config The configuration object which must be

	 */
	register : function(browserWindowObject,component,config)
	{
		var uniqueWindowName = browserWindowObject.name;
		if (uniqueWindowName != 'mainBrowserWindow') {
			this.initComponent(uniqueWindowName, component, config);
		}
		this.browserWindows.add(uniqueWindowName, browserWindowObject);
		this.setActive(uniqueWindowName);
	},

	/**
	 * De-register an already registered browser-window object from the {@link Zarafa.core.BrowserWindowMgr BrowserWindowMgr}.
	 * @param {String} uniqueWindowName The unique name of the browser window.
	 */
	unRegister : function(uniqueWindowName)
	{
		this.browserWindows.removeKey(uniqueWindowName);
		Ext.MessageBox.removeBrowserWindowMessageBox(uniqueWindowName);
		// As the window which was closed is also the active one, we are not able to decide which window should be considered
		// as an active one. So assign 'undefined' to the activeBrowserWindow which will later on replaced while other
		// available window receive focus.
		if(this.activeBrowserWindow === uniqueWindowName){
			this.activeBrowserWindow = undefined;
		}
	},

	/**
	 * A helper function which creates main container into the separate window and load the required
	 * component within. Some necessary events needs to be registered as well.
	 * @param {Object} separateWindowInstance Browser window object.
	 * @protected
	 */
	createUI : function(separateWindowInstance)
	{
		// Enable tooltips
		Ext.QuickTips.init();

		var separateWindowId = separateWindowInstance.name;

		//The constructor of the component which has to be created in the container layer.
		var browserWindowComponent;

		if (this.browserWindowComponents.containsKey(separateWindowId)) {
			browserWindowComponent = this.browserWindowComponents.get(separateWindowId);
		} else if (!Ext.isEmpty(this.blockedPopupsContent)) {
			// No inner components found for this particular popup window.
			// This is the situation where some popups were blocked by browser and
			// user manually allows to load the same.
			var blockedPopup = this.blockedPopupsContent.pop();
			this.register(separateWindowInstance, blockedPopup.component, blockedPopup.config);
			browserWindowComponent = this.browserWindowComponents.get(separateWindowId);
			this.isPopupsBlocked = false;
		}

		var component = browserWindowComponent.component;

		//The configuration object
		var config = {
			plugins : [ 'zarafa.contentlayerplugin' ],
			confirmClose : false
		};
		config = Ext.applyIf(config,browserWindowComponent.config);

		// Create instance of the component which is required to be rendered into the separate browser window.
		var componentInstance = new component(config);

		var mainContainer = Ext.create({
			xtype : 'panel',
			height : separateWindowInstance.innerHeight,
			width : separateWindowInstance.innerWidth,
			renderTo : Ext.get(separateWindowInstance.document.body),
			layout : 'fit',
			items : [componentInstance]
		});

		// Check the record has unsaved user changes before popout

		// If true then update the record component plugin value
		if(config.isRecordChangeByUser){
			componentInstance.recordComponentPlugin.isChangedByUser = config.isRecordChangeByUser;
		}
		this.initEvents(separateWindowInstance, componentInstance, mainContainer);

		// We need to use some delay due to the behavioral difference between various browsers.
		// Let say we are creating 5 popups, Chrome blocks the last popups, and FF blocks the first one.
		// When first popup gets rendered and following popups will be blocked than there is no way to
		// listen to any event of already-rendered popup and display warning message in already rendered popup.
		var task = new Ext.util.DelayedTask(Zarafa.core.BrowserWindowMgr.displayBlockedPopupWarning.createDelegate(this, [separateWindowInstance], this));
		task.delay(200);
	},

	/**

	/**
	 * Provides browser window object mapped with the unique name currently assigned in {@link #activeBrowserWindow}.
	 * @return {Object} Browser window object
	 */
	getActive: function()
	{
		// Some time while child window not available any more and main window focus not set
		// at that time activeBrowser window will not available.
		// So handle this type of situation by returning main browser window while active browser window not available

		return this.browserWindows.get(this.activeBrowserWindow) || this.browserWindows.get('mainBrowserWindow');
	},

	/**
	 * Assign the provided window name to {@link #activeBrowserWindow}.
	 * @param {String} uniqueWindowName The unique name of the browser window.
	 */
	setActive : function(uniqueWindowName)
	{
		this.activeBrowserWindow = uniqueWindowName;

		// Activate respective QuickTip which is associated with the active browser window.
		if(Ext.QuickTips && Ext.QuickTips.tip) {
			var activeQuickTip = Ext.QuickTips.browserQuickTips.get(uniqueWindowName);
			if(Ext.isDefined(activeQuickTip)) {
				Ext.QuickTips.tip = activeQuickTip;
			}
		}

		// Activate respective MessageBox which is associated with the active browser window.
		Ext.MessageBox.setActiveWindowMessageBox(uniqueWindowName);
	},

	/**
	 * Determines if the webapp-main-window is currently active or not by checking that the value currently
	 * assigned into {@link #activeBrowserWindow} is 'mainBrowserWindow'.
	 * @return {Boolean} True if the active window is webapp-main-window, false otherwise.
	 */
	isMainWindowActive : function()
	{
		return this.activeBrowserWindow === 'mainBrowserWindow';
	},

	/**
	 * Helper function which allows to know which browser window object is the owner of any particular component
	 * passed as argument.
	 * @param {Ext.Component} component of which we want to get the owning browser window.
	 *
	 * @return {Boolean} true if the owner is main webapp window, false otherwise
	 */
	isOwnedByMainWindow : function(component)
	{
		var ownerWindow = this.getOwnerWindow(component);
		return ownerWindow ? ownerWindow.name === 'mainBrowserWindow' : false;
	},

	/**
	 * Helper function which returned the owning window of the element passed as argument.
	 * @param {Ext.Component/Ext.Element} component/element of which we want to get the owning browser window.
	 *
	 * @return {Object} Browser window object
	 * @private
	 */
	getOwnerWindow : function(component)
	{
		if(!Ext.isDefined(component)){
			return undefined;
		}

		// Incase we receive Ext.Component as parameter then we have to get underlying Ext.Element
		if(Ext.isFunction(component.getEl)){
			component = component.getEl();
		}

		var componentDom = component.dom ? component.dom : component;
		var ownerDocument = componentDom ? componentDom.ownerDocument : undefined;
		var defaultView = ownerDocument ? ownerDocument.defaultView : undefined;
		return defaultView ? defaultView :  this.browserWindows.get('mainBrowserWindow');
	},

	/**
	 * Event handler which is raised when browser window receives user focus.
	 * This will make respective browser window active into {@link Zarafa.core.BrowserWindowMgr BrowserWindowMgr}.
	 *
	 * @param {Object} browserWindowId The newly created window object id which must be registered.
	 * @private
	 */
	onSeparateWindowFocus : function(browserWindowId)
	{
		this.setActive(browserWindowId);
	},

	/**
	 * Event handler which is raised when browser window gets closed.
	 * This will de-register the closed component instance from {@link Zarafa.core.data.ContentPanelMgr ContentPanelMgr}.
	 * This will remove all the child elements of the parent most container of separate window.
	 * This will de-register the closed window instance from {@link Zarafa.core.BrowserWindowMgr BrowserWindowMgr}.
	 *
	 * @param {Object} browserWindowObject The newly created window object which must be registered.
	 * @param {Ext.Component} componentInstance component which is required to be rendered into the separate browser window.
	 * @param {Ext.Container} mainContainer The container which is the parent most container of separate window.
	 * @private
	 */
	onSeparateWindowUnload : function(browserWindowObject, componentInstance, mainContainer)
	{
		Ext.defer(this.onWindowRefreshOrClose, 50, this, [browserWindowObject,componentInstance,browserWindowObject.name]);
		mainContainer.destroy();
	},

	/**
	 * Function which handles the situation where window gets refreshed or closed
	 * if it was refresh then create record instance based on original record and update the browser window component config.
	 * And if window was closed then de-register the closed window component from {@link #browserWindowComponents}.
	 * @param {Object} win The browser window which gets refresh or closed.
	 * @param {Ext.Component} componentInstance component of the separate browser window.
	 * @param {Object} browserWindowId The newly created window object id which must be registered.
	 */
	onWindowRefreshOrClose: function (win, componentInstance, browserWindowId)
	{
		var isClose = false,
			oldRecord = componentInstance.record;
		try {
			if (!win || !win.innerWidth) {
				isClose = true;
			} else {
				var config = this.browserWindowComponents.get(win.name).config,
					model = container.getCurrentContext().getModel(),
					newRecord;

				if (Ext.isDefined(config.recordComponentPluginConfig) && Ext.isDefined(config.recordComponentPluginConfig.useShadowStore)) {
					config.recordComponentPluginConfig.useShadowStore = true;
				}

				// on window refresh we have to discard all unsaved user changes
				// If record is not phantom then get new record from respective store using oldRecord id properties.
				if (!oldRecord.phantom) {
					var recordConfig = {
						store_entryid: oldRecord.get('store_entryid'),
						parent_entryid: oldRecord.get('parent_entryid'),
						entryid: oldRecord.get('entryid')
					};

					newRecord = Zarafa.core.data.RecordFactory.createRecordObjectByMessageClass('IPM.Note', recordConfig, oldRecord.get('entryid'));
				} else {
					// if record is phantom then we have to discard this record and
					// create new record using respective context model
					var model = container.getCurrentContext().getModel();
					newRecord = model.createRecord();
				}
				if (Ext.isDefined(config.isRecordChangeByUser)) {
					config.isRecordChangeByUser = undefined;
				}
				win.onbeforeunload = undefined;

				// Update the new record in respective browser window config
				config.record = newRecord;
			}
		} catch (e) {
			// Catch an Exception. Firefox will throw one when we
			// try to access property of the window that does not
			// exist anymore.
			isClose = true;
		}
		container.getShadowStore().remove(oldRecord, true);
		if (isClose) {
			this.browserWindowComponents.removeKey(browserWindowId);
			this.unRegister(browserWindowId);
		}
	},

	/**

	/**
	 * Event handler which is raised after the {@link Zarafa.core.ui.ContentPanel contentPanel} has been
	 * closed. This will de-register the closed window instance from {@link Zarafa.core.BrowserWindowMgr BrowserWindowMgr}.
	 *
	 * @private
	 */
	onSeparateWindowClose : function(browserWindowObject)
	{
		browserWindowObject.close();
	},

	/**
	 * Event handler which is raised when the browser window gets resized.
	 * This will register a {@link Ext.util.DelayedTask DelayedTask} and set the delay of 100ms.
	 * Delay is required to avoid executing the handler frequently, if event fires multiple time within the specified time-frame
	 * then the handler will gets executed only once for the last event.
	 *
	 * @param {Object} browserWindowObject The browser window which gets resized.
	 * @param {Ext.Container} mainContainer The container which needs to be resized according to the size of browser window.
	 * @private
	 */
	onSeparateWindowResize : function(browserWindowObject, mainContainer)
	{
		var resizeTask = new Ext.util.DelayedTask(
			this.doSeparateWindowResize,
			this,
			[browserWindowObject, mainContainer]
		);

		resizeTask.delay(100);
	},

	/**
	 * A {@link Ext.util.DelayedTask DelayedTask} which will set size of main container according to the browser window
	 * when it gets resized.
	 *
	 * @param {Object} browserWindowObject The browser window which gets resized.
	 * @param {Ext.Container} mainContainer The container which needs to be resized according to the size of browser window.
	 * @private
	 */
	doSeparateWindowResize : function(browserWindowObject, mainContainer)
	{
		var width = browserWindowObject.innerWidth || Ext.lib.Dom.getViewWidth();
		var height = browserWindowObject.innerHeight || Ext.lib.Dom.getViewHeight();
		mainContainer.setSize(width, height);

		this.fireEvent('separatewindowresize', browserWindowObject, width. height);
	},

	/**
	 * Event handler which is fired when the {@link Ext#getBody &lt;body&gt;} elements fires
	 * the 'contextmenu' event. If the element which fired the event doesn't have the
	 * 'zarafa-contextmenu-enabled' class then the Browser contextmenu will be disabled.
	 * @param {Ext.EventObject} event The event object
	 * @param {Ext.Element} el The element on which the contextmenu was requested
	 * @private
	 */
	onBodyContextMenu : function(event, el)
	{
		// Disable contextmenu globally in the separate browser window,
		// only when the 'zarafa-contextmenu-enabled'
		// CSS class is applied on the element will we allow the contextmenu to be shown.
		if (!Ext.get(el).hasClass('zarafa-contextmenu-enabled')) {
			event.preventDefault();
		}
	},

	/**
	 * Function which is used to close all browser windows except main window
	 */
	closeAllBrowserWindow : function()
	{
		var browserWindows = Zarafa.core.BrowserWindowMgr.browserWindows.items;
		Ext.each(browserWindows,function(windowObject){
			if(windowObject.name !== 'mainBrowserWindow'){
				windowObject.close();
			}
		});
	},

	/**
	 * Function which is used to initialize ext doc classes on separate window
	 * Ext has some separate doc classes for all browsers,and
	 * must be initialize those classes for newly created window.
	 * @param browserWindowObject The newly created window object which must be registered.
	 * @returns {boolean} true if all doc classes successfully apply on new window, false otherwise
	 */
	initExtCss: function (browserWindowObject) {
		// find the body element
		var body = browserWindowObject.document.body || browserWindowObject.document.getElementsByTagName('body')[0];
		if (!body) {
			return false;
		}

		Ext.fly(body.parentElement).addClass('x-viewport');

		var cls = [];

		if (Ext.isIE) {
			// Only treat IE9 and less like IE in the css
			if (!Ext.isIE10p) {
				cls.push('ext-ie');
			}
			if (Ext.isIE6) {
				cls.push('ext-ie6');
			} else if (Ext.isIE7) {
				cls.push('ext-ie7', 'ext-ie7m');
			} else if (Ext.isIE8) {
				cls.push('ext-ie8', 'ext-ie8m');
			} else if (Ext.isIE9) {
				cls.push('ext-ie9', 'ext-ie9m');
			} else if (Ext.isIE10) {
				cls.push('ext-ie10');
			}
		}

		if (Ext.isGecko) {
			if (Ext.isGecko2) {
				cls.push('ext-gecko2');
			} else {
				cls.push('ext-gecko3');
			}
		}

		if (Ext.isOpera) {
			cls.push('ext-opera');
		}

		if (Ext.isWebKit) {
			cls.push('ext-webkit');
		}

		if (Ext.isSafari) {
			cls.push("ext-safari " + (Ext.isSafari2 ? 'ext-safari2' : (Ext.isSafari3 ? 'ext-safari3' : 'ext-safari4')));
		} else if (Ext.isChrome) {
			cls.push("ext-chrome");
		}

		if (Ext.isMac) {
			cls.push("ext-mac");
		}
		if (Ext.isLinux) {
			cls.push("ext-linux");
		}

		// add to the parent to allow for selectors like ".ext-strict .ext-ie"
		if (Ext.isStrict || Ext.isBorderBox) {
			var p = body.parentNode;
			if (p) {
				if (!Ext.isStrict) {
					Ext.fly(p, '_internal').addClass('x-quirks');
					if (Ext.isIE9m && !Ext.isStrict) {
						Ext.isIEQuirks = true;
					}
				}
				Ext.fly(p, '_internal').addClass(((Ext.isStrict && Ext.isIE ) || (!Ext.enableForcedBoxModel && !Ext.isIE)) ? ' ext-strict' : ' ext-border-box');
			}
		}
		// Forced border box model class applied to all elements. Bypassing javascript based box model adjustments
		// in favor of css.  This is for non-IE browsers.
		if (Ext.enableForcedBoxModel && !Ext.isIE) {
			Ext.isForcedBorderBox = true;
			cls.push("ext-forced-border-box");
		}

		Ext.fly(body, '_internal').addClass(cls);
		return true;
	},

	/**
	 * Function which is used to display warning message while browser blocks popups
	 */
	displayBlockedPopupWarning : function() {
		if(Zarafa.core.BrowserWindowMgr.isPopupsBlocked) {
			// We completed with the internal UI of single-allowed popup, Inform user that popup is blocked
			Ext.MessageBox.show({
				title : _("Open in new browser window"),
				msg : _("Your browser seems to have blocked one or more pop-ups. Please change your browser's settings to always allow pop-ups from WebApp."),
				buttons: Ext.Msg.OK,
				icon: Ext.MessageBox.WARNING
			});

			Zarafa.core.BrowserWindowMgr.isPopupsBlocked = false;
		}
	},

	/**
	 * Helper function which will bring the main webapp window to front
	 * @param {Ext.Component/Ext.Element} component/element of which will use to get the owning browser window.
	 */
	switchFocusToMainWindow: function (component)
	{
		var activeWindow = this.getActive();

		// if component belongs to one of the currently opened popout windows then get owner window of component
		if (Ext.isDefined(component) && !this.isOwnedByMainWindow(component)) {
			activeWindow = this.getOwnerWindow(component);
		}

		activeWindow.setFocusOnMainWindow();
	}
});

Zarafa.core.BrowserWindowMgr = new Zarafa.core.BrowserWindowMgr();
