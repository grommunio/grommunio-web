Ext.namespace('Zarafa.core');

/**
 * @class Zarafa.core.KeyMapMgr
 * @extends Object
 *
 * The {@link Zarafa.core.KeyMap KeyMap} manager.
 * @singleton
 */
Zarafa.core.KeyMapMgr = Ext.extend(Object, {
	/**
	 * The list of registered {@link Zarafa.core.KeyMap keymaps}. It contains the list with the element the
	 * keymap is bound to as key.
	 * @property
	 * @type Object
	 * @private
	 */
	keyMaps : undefined,

	/**
	 * The list of key configurations (see {@link Zarafa.core.KeyMap#addBinding Zarafa.core.KeyMap.addBinding})
	 * registeredlisted to a mapId. It contains the list with the mapId as the key.
	 * @property
	 * @type Object
	 * @private
	 */
	keys : undefined,

	/**
	 * @constructor
	 */
	constructor : function()
	{
		this.keyMaps = new Ext.util.MixedCollection();
		this.keys = {};
	},

	/**
	 * Registers the key binding configuration to the specified mapId.
	 * @param {String} mapId The ID of the map keys are registered to.
	 * @param {Object|Array} keyConfig The config (see {@link Zarafa.core.KeyMap#addBinding addBinding}).
	 */
	register : function(mapId, keyConfig)
	{
		if(!this.keys[mapId]){
			this.keys[mapId] = [];
		}

		if(!Ext.isArray(keyConfig)) {
			keyConfig = [keyConfig];
		}

		this.keys[mapId] = this.keys[mapId].concat(keyConfig);

		// register same bindings for global webapp as well
		this.preventBrowserDefaults(mapId, keyConfig);
	},

	/**
	 * Function will register all key bindings that are registerd in {@link Zarafa.core.KeyMapMgr this}
	 * class to the 'globaldisable' mapid and assign stop event and empty hadler so that we can disable
	 * default behaviour of browser when no component is focused and user tries to perform some
	 * key-combinations which isn't available globally.
	 * @param {String} mapId The ID of the map keys are registered to.
	 * @param {Object|Array} keyConfig The config (see {@link Zarafa.core.KeyMap#addBinding addBinding}).
	 */
	preventBrowserDefaults : function(mapId, keyConfig)
	{
		// Check that mapID isn't 'global' as they are already registered globally.
		// Check that mapID isn't 'globaldisable' to prevent recursive call.
		if(mapId !== 'global' && mapId !== 'globaldisable') {
			for(var i = 0, len = keyConfig.length; i < len; i++) {
				var config = keyConfig[i];

				if(config.enableGlobally !== true) {
					var disableKeyConfig = {
						handler : Ext.emptyFn,
						stopEvent : true
					};

					Ext.applyIf(disableKeyConfig, config);

					// Add all events in 'globaldisable' keymap.
					this.register('globaldisable', disableKeyConfig);
				} else if (config.ctrl === true) {
					var key = config.key;
					if(Ext.isString(key)) {
						key = key.toUpperCase().charCodeAt(0);
					}

					if (key === Ext.EventObject.A) {
						// special case for ctrl + a, as we want to allow action in text fields but not on body of webapp
						var disableKeyConfig = {
							handler : this.disableTextSelection,
							// don't blindly prevent default action instead leave that handling for the handler
							stopEvent : false
						};

						Ext.applyIf(disableKeyConfig, config);

						// Add event in 'globaldisable' keymap.
						this.register('globaldisable', disableKeyConfig);
					}
				}
			}
		}
	},

	/**
	 * Event handler for the keydown event of the {@link Ext.KeyMap KeyMap}
	 * when the user presses ctrl + a on a field which doesn't have text selection. So we will prevent
	 * default action of browser to select all text in the body.
	 * @param {Number} key Key code
	 * @param {Ext.EventObject} event The event
	 * @param {Ext.Component} component The component on which key event is fired.
	 */
	disableTextSelection : function(key, event, component)
	{
		var target = event.getTarget().nodeName.toLowerCase();

		if(target !== 'textarea' && target !== 'input') {
			// we don't want to select everything in the body
			event.stopEvent();
		}
	},

	/**
	 * Adds the keymap to the specified Element. It will take the keys registered in {@link #keys keys}
	 * under the specified mapId. If a keymap has already been registered under this element it will add new keys
	 * to the same {@link Zarafa.core.KeyMap KeyMap}.
	 *
	 * If basic shortcuts are enabled we filter the bindings obtained from the mapId to only
	 * enable the bindings which contain the basic key.
	 *
	 * @param {Ext.Component} component The component to which keymap should be bound and
	 * will listen keypress events on {@link Ext.Component#el}.
	 * @param {String} mapId The ID of the map keys are registered to.
	 * @param {Ext.Element} element {optional} if component is not present and we need to register key events
	 * on any element then we can pass it here (eg Ext.getBody()). Additionally if we want to register events on
	 * different element then {@link Ext.Component#el} then we should pass the element on which keymap
	 * will be registered (eg Zarafa.common.ui.HTMLEditor).
	 */
	activate : function(component, mapId, element)
	{
		// if element is not passed then get it from component
		if(!element) {
			element = component.getEl();
		}

		// if element is passed as dom node then find its corresponding Ext.Element object
		element = Ext.get(element);

		var elementId = element.id;
		if(Ext.isEmpty(elementId)) {
			// without element id its not possible to activate keymap
			return;
		}

		var bindings = this.getKeyBindings(mapId);
		var setting = container.getSettingsModel().get('zarafa/v1/main/keycontrols');

		// Filter basic shortcuts
		if (setting === Zarafa.settings.data.KeyboardSettings.BASIC_KEYBOARD_SHORTCUTS) {
			bindings = bindings.filter(function(binding) {
				return Ext.isDefined(binding.basic);
			});
		} else if (setting === Zarafa.settings.data.KeyboardSettings.NO_KEYBOARD_SHORTCUTS) {
			bindings = [];
		}

		if(Ext.isEmpty(bindings)) {
			// if no bindings are found then ignore
			return;
		}

		// check if we already have a registered keymap on this component
		// if we have then add binding with that keymap.
		var keymap = this.getActive(element);
		if(keymap) {
			keymap.addBinding(bindings);
		} else {
			// register event that will remove keymap from KeyMapMgr if component is destroyed
			if(component instanceof Ext.Component) {
				component.on('beforedestroy', this.onComponentDestroy, this);
			}

			// create a new keymap and register it on component
			this.keyMaps.add(elementId, new Zarafa.core.KeyMap(component, bindings, element));
		}
	},

	/**
	 * Function is used to get key bindings registered for a particular map id.
	 * It will recursively get bindings for every string seperated using dot and then will
	 * combine and return the bindings.
	 * @param {String} mapId map id for which we need to get bindings
	 * @return {Array} array of key bindings that be added in keymap
	 */
	getKeyBindings : function(mapId)
	{
		// Get the bindings registered for the mapId. Also see if any other bindings have been
		// registered on mapIds that are hierarchically-speaking its parent. So
		// "contentpanel.record.message" will also get keys for "contentpanel.record" and
		// "contentpanel".
		var bindings = [];

		while(!Ext.isEmpty(mapId)) {
			// get binding for particular map id
			if(this.keys[mapId]) {
				bindings = bindings.concat(this.keys[mapId]);
			}

			// change map id to point to its parent
			mapId = mapId.substr(0, mapId.lastIndexOf('.'));
		}

		return bindings;
	},

	/**
	 * Handler function that will be called when any component registered with {@link Zarafa.core.KeyMapMgr KeyMapMgr}
	 * is going to be destroyed, so we can safely remove keymappings registered with that component.
	 * @param {Ext.Component} component component that is going to be destroyed
	 */
	onComponentDestroy : function(component)
 	{
		this.deactivate(component.getEl());
	},

	/**
	 * Disables the {@link Zarafa.core.KeyMap keymap} and removes it from list of {@link Zarafa.core.KeyMapMgr#keyMaps}.
	 * {@link Zarafa.core.KeyMap#disable} removes event listener which is used to check and fire handler events for bindings
	 * but it doesn't remove bindings registered with the {@link Zarafa.core.KeyMap keymap} that will be done only when
	 * element is destroyed from dom.
	 * @param {Ext.Element} element The element on which keymap is bound.
	 */
	deactivate : function(element)
	{
		element = Ext.get(element);
		var keymap = this.keyMaps.get(element.id);

		if(keymap) {
			keymap.disable();
			this.keyMaps.remove(keymap);
		}
	},

	/**
	 * Function returns {@link Zarafa.core.KeyMap keymap} bound to component or element.
	 * @param {Ext.Element} element The element which should be used to check for bound keymaps.
	 * @return {Zarafa.core.KeyMap} keymap object registered on component/element
	 */
	getActive: function(element)
	{
		// if element is passed as dom node then find its corresponding Ext.Element object
		element = Ext.get(element);

		return this.keyMaps.get(element.id);
	},

	/**
	 * Will enable the {@link Zarafa.core.KeyMap keymap} that is registered on the specified element.
	 * @param {Ext.Element} element The element on which keymap is bound.
	 */
	enableKeyMap: function(element)
	{
		// if element is passed as dom node then find its corresponding Ext.Element object
		element = Ext.get(element);

		var keymap = this.keyMaps.get(element.id);

		if(keymap) {
			if(this.isGloballyEnabled()) {
				// We need to check whether we are not in a state where the keymaps have been disabled globally.
				keymap.enable();
			} else {
				// Only set the originallyEnabled flag on the keymap when the keymaps have been disabled globally in the KeyMapMgr.
				keymap.originallyEnabled = true;
			}
		}
	},

	/**
	 * Will disable the {@link Zarafa.core.KeyMap keymap} that is registered on the specified element.
	 * @param {Ext.Element} element The element on which keymap is bound.
	 */
	disableKeyMap: function(element)
	{
		// if element is passed as dom node then find its corresponding Ext.Element object
		element = Ext.get(element);

		var keymap = this.keyMaps.get(element.id);

		if(keymap) {
			keymap.disable();

			// Only set the originallyEnabled flag on the keymap when the keymaps have been disabled globally in the KeyMapMgr.
			if(!this.isGloballyEnabled()) {
				keymap.originallyEnabled = false;
			}
		}
	},

	/**
	 * Can be used to enable the keymaps globally and works in conjucture with {@link #disable} that
	 * is able to disable all the keymaps globally.
	 * Will enable the all the registered keymaps that have an originallyEnabled flag set to true.
	 * After that each keymap, including the ones that have the originallyEnabled flag set to false,
	 * will have that flag cleared from the keymap object.
	 */
	enableAllKeymaps : function()
	{
		this.keyMaps.each(function(keymap) {
			if(keymap.originallyEnabled === true) {
				keymap.enable();
			}

			// Unset the originallyEnabled flag on the keymap object
			delete keymap.originallyEnabled;
		}, this);
	},

	/**
	 * Can be used to disable the keymaps globally and works in conjucture with {@link #enable} that
	 * is able to enable all the keymaps globally.
	 * Will enable the all the registered keymaps that have an originallyEnabled flag set to true.
	 * After that each keymap, including the ones that have the originallyEnabled flag set to false,
	 * will have that flag cleared from the keymap object.
	 */
	disableAllKeymaps : function()
	{
		this.keyMaps.each(function(keymap) {
			keymap.originallyEnabled = keymap.isEnabled();
			keymap.disable();
		}, this);
	},

	/**
	 * Checks if the {@link Zarafa.core.KeyMap keymap} is enabled on the specified element.
	 * @param {Ext.Element} element The element on which keymap is bound.
	 * @return {Boolean} True when enabled, false otherwise.
	 */
	isEnabled : function(element)
	{
		var keymap = this.getActive(element);

		return keymap && keymap.isEnabled();
	},

	/**
	 * Returns whether the keymaps are globally enabled or not.
	 * return {Boolean} True when enabled, false otherwise.
	 */
	isGloballyEnabled : function()
	{
		return container.getSettingsModel().get('zarafa/v1/main/keycontrols') !== Zarafa.settings.data.KeyboardSettings.NO_KEYBOARD_SHORTCUTS;
	}
});

Zarafa.core.KeyMapMgr = new Zarafa.core.KeyMapMgr();
