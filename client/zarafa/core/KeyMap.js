Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.KeyMap
 * @extends Ext.KeyMap
 * 
 * This class extends {@link Ext.KeyMap KeyMap} to assign component with key events
 * so we can pass component as a parameter while calling callback function, to make
 * key event handling easier.
 */
Zarafa.core.KeyMap = Ext.extend(Ext.KeyMap, {
	/**
	 * @cfg {Ext.Component} component The component on which key event is registered.
	 */
	component : undefined,

	/**
	 * @constructor
	 * @param {Ext.Component} component The component which should be used to pass in handlers and additionally
	 * if element is not passed then get it from component.
	 * @param {Object} config The configuration object (see {@link #addBinding})
	 * @param {Ext.Element} element {optional} The element on which this keymap will be bound.
	 * @param {String} eventName (optional) The event to bind to (defaults to "keydown")
	 */
	constructor : function(component, config, element, eventName)
	{
		if(component) {
			// store reference of component in keymap that will be passed with call to handlers
			this.component = component;
		}

		// if no element is passed then get it from component
		if(!element) {
			element = component.getEl();
		}

		// if element is passed as dom node then find its corresponding Ext.Element object
		element = Ext.get(element);

		Zarafa.core.KeyMap.superclass.constructor.call(this, element, config, eventName);
	},

	/**
	 * Function overrides {@link Ext.KeyMap#addBinding addBinding} to <br>
	 * 1) add component in callback function parameter for which event is fired. <br>
	 * 2) to solve the problem of {@link Ext.KeyMap} that, When registering two different key bindings to
	 * same {@link Ext.KeyMap} object, we can't set 'stopEvent: false' in any of the bindings <br>
	 * for more info - http://www.sencha.com/forum/showthread.php?265199-Ext.KeyMap-problems-with-stopEvent-flag <br>
	 * 3) additionally this can accept some more config options which is used in {@link Zarafa.core.KeyMapMgr KeyMapMgr},
	 * <pre>
Property           Type        Description
----------         ---------   ----------------------------------------------------------------------
enableGlobally     Boolean     A flag to indicate the key binding should also be registered with the body of webapp so that key combination can globally be disabled
settingsCfg        Object      Object containing two keys:
                                    1) description - description of the key combination to show in keyboard settings widget
                                    2) category - name of the category in which this key combination will be added
</pre>
	 */
	addBinding : function(config)
	{
		if(Array.isArray(config)){
			Ext.each(config, function(c){
				this.addBinding(c);
			}, this);
			return;
		}
		var keyCode = config.key,
			fn = config.fn || config.handler,
			scope = config.scope,
			stopEvent = config.stopEvent;

		if(!Ext.isDefined(stopEvent)) {
			stopEvent = this.stopEvent;
		}

		if(typeof keyCode == "string"){
			var ks = [];
			var keyString = keyCode.toUpperCase();
			for(var j = 0, len = keyString.length; j < len; j++){
				ks.push(keyString.charCodeAt(j));
			}
			keyCode = ks;
		}
		var keyArray = Array.isArray(keyCode);
		
		var handler = function(e){
			if(this.checkModifiers(config, e)){
				var k = e.getKey();

				if(keyArray){
					for(var i = 0, len = keyCode.length; i < len; i++){
						if(keyCode[i] == k){
							if(stopEvent){
								e.stopEvent();
							}
							fn.call(scope || window, k, e, this.component);
							return;
						}
					}
				}else{
					if(k == keyCode){
						if(stopEvent){
							e.stopEvent();
						}
						fn.call(scope || window, k, e, this.component);
					}
				}
			}
		};
		this.bindings.push(handler);
	}
});