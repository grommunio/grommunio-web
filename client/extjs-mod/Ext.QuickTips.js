Ext.namespace('Ext.QuickTips');
/*
 * @class Ext.QuickTips
 * Provides attractive and customizable tooltips for any element belongs to any available browser windows.
 * Maintains a list of all the {@link Ext.QuickTip} instances created for each of the available browser windows.
 * @singleton
 */
Ext.QuickTips = Ext.extend(Object, {
	/**
	 * The list of registered {@link #tip} bound to a unique browser window name.
	 * @property
	 * @type Ext.util.MixedCollection
	 * @private
	 */
	browserQuickTips : undefined,

	/**
	 * The {@link Ext.QuickTip} instance belongs to specific browser window which
	 * is currently {@link Zarafa.core.BrowserWindowMgr.activeBrowserWindow active}.
	 * @property
	 * @type String
	 * @private
	 */
	tip : undefined,

	/**
	 * Render this tip disabled.
	 * @property
	 * @type Boolean
	 * @private
	 */
	disabled : false,

	/**
	 * @constructor
	 */
	constructor : function(config)
	{
		config = config || {};

		this.browserQuickTips = new Ext.util.MixedCollection();
	},

	/**
	 * Initialize the global QuickTips instance and prepare any quick tips.
	 * @param {Boolean} autoRender True to render the QuickTips container immediately to preload images. (Defaults to true) 
	 */
	init : function(autoRender) {
		if(!Ext.isReady){
			Ext.onReady(function(){
				Ext.QuickTip.init(autoRender);
			});
			return;
		}
		this.tip = new Ext.QuickTip({
			elements:'header,body', 
			disabled: this.disabled
		});
		if(autoRender !== false){
			this.tip.render(Ext.getBody());
		}

		this.browserQuickTips.add(Zarafa.core.BrowserWindowMgr.getOwnerWindow(this.tip).name, this.tip);
	},

	// Protected method called by the dd classes
	ddDisable : function(){
		// don't disable it if we don't need to
		if(this.tip && !this.disabled){
			this.tip.disable();
		}
	},
	
	// Protected method called by the dd classes
	ddEnable : function(){
		// only enable it if it hasn't been disabled
		if(this.tip && !this.disabled){
			this.tip.enable();
		}
	},

	/**
	 * Enable quick tips globally.
	 */
	enable : function(){
		if(this.tip){
			this.tip.enable();
		}
		this.disabled = false;
	},

	/**
	 * Disable quick tips globally.
	 */
	disable : function(){
		if(this.tip){
			this.tip.disable();
		}
		this.disabled = true;
	},

	/**
	 * Returns true if quick tips are enabled, else false.
	 * @return {Boolean}
	 */
	isEnabled : function(){
		return this.tip !== undefined && !this.tip.disabled;
	},

	/**
	 * Gets the single {@link Ext.QuickTip QuickTip} instance used to show tips from all registered elements.
	 * @return {Ext.QuickTip}
	 */
	getQuickTip : function(){
		return this.tip;
	},

	/**
	 * Configures a new quick tip instance and assigns it to a target element.  See
	 * {@link Ext.QuickTip#register} for details.
	 * @param {Object} config The config object
	 */
	register : function(){
		this.tip.register.apply(this.tip, arguments);
	},

	/**
	 * Removes any registered quick tip from the target element and destroys it.
	 * @param {String/HTMLElement/Element} el The element from which the quick tip is to be removed.
	 */
	unregister : function(){
		this.tip.unregister.apply(this.tip, arguments);
	},

	/**
	 * Alias of {@link #register}.
	 * @param {Object} config The config object
	 */
	tips : function(){
		this.tip.register.apply(this.tip, arguments);
	}
});
Ext.QuickTips = new Ext.QuickTips();