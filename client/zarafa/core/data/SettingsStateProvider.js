Ext.namespace('Zarafa.core.data');

/**
 * @class Zarafa.core.data.SettingsStateProvider
 * @type Ext.state.Provider
 * 
 * A special {@link Ext.state.Provider} for the {@link Ext.state.Manager}
 * which stores the state of {@link Zarafa.core.ui.ContentPanel content panels}, {@link Ext.Panel panels}
 * and {@link Ext.grid.GridPanel grids} into the {@link Zarafa.settings.SettingsModel settings}.
 */
Zarafa.core.data.SettingsStateProvider = Ext.extend(Ext.state.Provider, {

	/**
	 * @cfg {String} basePath The base path of the {@link Zarafa.settings.SettingsModel settings}
	 * in which all State settings must be saved. The complete name for a settings path is generated
	 * by {@link #getStatePath}.
	 */
	basePath : 'zarafa/v1/state',

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		Ext.apply(this, config);

		Zarafa.core.data.SettingsStateProvider.superclass.constructor.call(this, config);
	},

	/**
	 * Create the path of the {@link Zarafa.settings.SettingsModel settings}
	 * in which the {@link Ext.Component#getState state} for the given {@link Ext.Component component}
	 * must be saved. This adds the {@link Ext.Component#getStateName State name} to the
	 * {@link #basePath}.
	 * @return {String} The Settings path in which the state for the component must be saved.
	 */
	getStatePath : function(component)
	{
		return this.basePath + '/' + component.getStateName();
	},

	/**
	 * Encodes a value including type information.  Decode with {@link #decodeValue}.
	 * @param {Mixed} value The value to encode
	 * @param {String} name The property name (if this function was called recursively) of the property being encoded
	 * @param {Ext.Component} component The component for which the settings are being encoded
	 * @return {String} The encoded value
	 */
	encodeValue : function(value, name, component)
	{
		if (Array.isArray(value)) {
			for (var i = 0, len = value.length; i < len; i++) {
				value[i] = this.encodeValue(value[i], name, component);
			}
		} else if (Ext.isObject(value)) {
			for (var key in value) {
				value[key] = this.encodeValue(value[key], key, component);
			}
		} else if ((name === 'height' || name === 'width') && component.statefulRelativeDimensions === true) {
			value = this.scaleSizeToPercentage(component, value, name);	
		}

		return value;
	},

	/**
	 * Decodes a string previously encoded with {@link #encodeValue}.
	 * @param {Mixed} value The value to decode
	 * @param {String} name The property name (if this function was called recursively) of the property being decoded
	 * @param {Ext.Component} component The component for which the settings are being decoded
	 * @return {Mixed} The decoded value
	 */
	decodeValue : function(value, name, component)
	{
		if (Array.isArray(value)) {
			for (var i = 0, len = value.length; i < len; i++) {
				value[i] = this.decodeValue(value[i], name, component);
			}
		} else if (Ext.isObject(value)) {
			for (var key in value) {
				value[key] = this.decodeValue(value[key], key, component);
			}
		} else if ((name === 'height' || name === 'width') && value <= 1.0) {
			value = this.scaleSizeToBody(component, value, name);
		}

		return value;
	},

	/**
	 * Convert a 'width' or 'height' value into a percentage of the current size of the body.
	 * This will ensure that when the WebApp is reloaded on a new display (with different resolution)
	 * the panel is scaled accordingly.
	 * @param {Ext.Component} component The component for which the percentages are calculated
	 * @param {Number} value The value to convert
	 * @param {String} type The type of the value (can be 'width' or 'height')
	 * @return {Number} The converted value
	 * @private
	 */
	scaleSizeToPercentage : function(component, value, type)
	{
		type = Ext.util.Format.capitalize(type);

		var body = window['inner' + type];
		value = parseFloat((value / body).toFixed(2));

		// Limit the value to 1, we don't accept it when the
		// component is resized to beyond the maximum of the
		// body element.
		return Math.min(value, 1);
	},

	/**
	 * Convert a 'width' or 'height' percentage into a real size depending on the size of the body.
	 * This will ensure that when the WebApp is reloaded on a new display (with different resolution)
	 * the panel is scaled accordingly. It will check the {@link Ext.Component#minWidth}/{@link Ext.Panel#maxWidth}
	 * and {@link Ext.Panel#minHeight}/{@link Ext.Panel#maxHeight} properties in the component to prevent
	 * it from becoming too big.
	 * @param {Ext.Component} component The component for which the real dimensions are determined.
	 * @param {Number} value The value to convert
	 * @param {String} type The type of the value (can be 'width' or 'height')
	 * @return {Number} The converted value
	 * @private
	 */
	scaleSizeToBody : function(component, value, type)
	{
		type = Ext.util.Format.capitalize(type);

		// Convert a 'width' or 'height' percentage into a real size depending on the size of active browser window body.
		var browserWindow = Zarafa.core.BrowserWindowMgr.getActive();
		var body = browserWindow['inner' + type];
		var minSize = component['min' + type];
		var maxSize = component['max' + type];

		value = Math.round(value * body);

		// Collapsible components with a SplitBar have a minSize/maxSize properties,
		// while normal panels have the minWidth/maxWidth & minHeight/maxHeight properties.
		if (component.minSize || component.maxSize) {
			value = Math.min(Math.max(value, component.minSize || 0), component.maxSize || value);
		} else if (minSize || maxSize) {
			value = Math.min(Math.max(value, minSize || 0), maxSize || value);
		}

		return value;
	},

	/**
	 * Sets the value for a key
	 * @param {String} name The key name
	 * @param {Mixed} value The value to set
	 */
	set : function(name, value)
	{
		var component = Ext.state.Manager.getComponent(name);
		container.getSettingsModel().set(this.getStatePath(component), this.encodeValue(value, undefined, component));
		this.fireEvent('statechange', this, name, value);
	},

	/**
	 * Returns the current value for a key
	 * @param {String} name The key name
	 * @param {Mixed} defaultValue A default value to return if the key's value is not found
	 * @return {Mixed} The state data
	 */
	get : function(name, defaultValue)
	{
		var component = Ext.state.Manager.getComponent(name);
		var value = container.getSettingsModel().get(this.getStatePath(component), true);

		if (Ext.isObject(defaultValue)) {
			value = Ext.apply(defaultValue, value);
		}

		return this.decodeValue(value, undefined, component);
	},

	/**
	 * Clears a value from the state
	 * @param {String} name The key name
	 */
	clear : function(name)
	{
		var component = Ext.state.Manager.getComponent(name);
		// Call restore rather then remove, to ensure the default values
		// are applied again.
		container.getSettingsModel().restore(this.getStatePath(component));
		this.fireEvent('statechange', this, name, null);
	}
});
