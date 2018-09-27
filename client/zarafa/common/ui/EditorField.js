Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.EditorField
 * @extends Ext.Container
 * @xtype zarafa.editorfield
 *
 * The WebApp EditorField is intended as Input area for data. This field
 * offers the possibility for editing using the {@link Zarafa.common.ui.HtmlEditor HtmlEditor}
 * or a simple {@link Ext.form.TextArea textarea}.
 *
 * TODO: Support dynamic switching of editor
 */
Zarafa.common.ui.EditorField = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Boolean} useHtml Use the {@link Zarafa.common.ui.HtmlEditor HTML editor}
	 * by default. Otherwise the {@link Ext.form.TextArea PlainTextEditor}.
	 */
	useHtml : true,
	/**
	 * @cfg {String} htmlXtype The Xtype of the component which is used for the Html editor
	 * By default this is {@link Zarafa.common.ui.HtmlEditor zarafa.htmleditor}.
	 */
	htmlXtype : 'zarafa.htmleditor',
	/**
	 * @cfg {String} plaintextXtype The Xtype of the component which is used for the Plain
	 * text editor. By default this is {@link Zarafa.common.form.TextArea textarea}.
	 */
	plaintextXtype : 'zarafa.textarea',
	/**
	 * @cfg {String} htmlName The {@link Ext.form.Field#name name} property of the
	 * {@link Zarafa.common.ui.HtmlEditor zarafa.htmleditor}
	 */
	htmlName : '',
	/**
	 * @cfg {String} plaintextName The {@link Ext.form.Field#name name} property of the
	 * {@link Zarafa.common.form.TextArea textarea}
	 */
	plaintextName : '',
	/**
	 * @cfg {Object} componentConfig (optional) The configuration object which must be
	 * used for the Editor component. This can be the configuration object for the
	 * {@link Zarafa.common.ui.HtmlEditor HtmlEditor} and {@link Zarafa.common.ui.TextArea textarea}.
	 * If this object is not set, the configuration object used to create this
	 * {@link Zarafa.common.ui.EditorField component} will be used.
	 */
	componentConfig : undefined,
	/**
	 * @cfg {Array} relayedEvents (optional) the array of event names which must
	 * be relayed from the Editor component to this {@link Zarafa.common.ui.EditorField field}.
	 * This allows the user to listen to events directly coming from the Editor.
	 */
	relayedEvents : ['change', 'valuecorrection','keypress', 'initialized'],
	/**
	 * @cfg {Boolean} enableSystemContextMenu Enable the browser's default contextmenu
	 * to be opened on the {@link #items element}.
	 */
	enableSystemContextMenu : true,
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.editorfield',
			layout: 'card',
			items : this.getEditors(config)
		});

		Ext.apply(this, config);

		// Determine the default item
		config.activeItem = this.useHtml ? 0 : 1;

		// Register all relayed events as possible events from this component
		this.addEvents.apply(this, this.relayedEvents);

		this.addEvents(
			/**
			 * @event setAutoFocusCursor
			 * Fires when text area gets the foucs.
			 */
			'setAutoFocusCursor'
		);

		Zarafa.common.ui.EditorField.superclass.constructor.call(this, config);

		this.on('beforerender', this.onBeforeRender, this);
		this.on('setAutoFocusCursor', this.onSetAutoFocusCursor, this);
	},

	/**
	 * Obtain the editors according to the configuration settings.
	 *
	 * This will generate {@link #htmlXtype HTML} and {@link #plaintextXtype plain-text}
	 * type editors.
	 *
	 * The Editor configuration is provided by componentConfig, if this
	 * was not configured by the caller, then we use the default configuration
	 * which was used to construct this {@link Ext.Container container}.
	 * @private
	 */
	getEditors : function(config)
	{
		var componentConfig = config.componentConfig;

		// If componentConfig is not given, we use  the config object itself,
		// but we must make sure to remove the config options we use only within
		// this main panel (this includes any layout options).
		if (!Ext.isDefined(componentConfig)) {
			componentConfig = Ext.apply({}, config);
			delete componentConfig.xtype;
			delete componentConfig.layout;
			delete componentConfig.layoutConfig;
			delete componentConfig.useHtml;
			delete componentConfig.htmlXtype;
			delete componentConfig.plaintextXtype;
			delete componentConfig.relayedEvents;
			delete componentConfig.listeners;
			delete componentConfig.ownerCt;
			delete componentConfig.ref;
		}

		// Apply some defaults
		Ext.applyIf(componentConfig, {
			// By default the HtmlEditor has hideMode : 'offsets',
			// which doesn't work with with the CardLayout as that
			// hides the Form element, but preserves the height
			// causing the other components to displayed at a weird
			// offset.
			hideMode : 'display',
			// Update reference
			ownerCt : this,
			// Toggle the system contextmenu
			enableSystemContextMenu : this.enableSystemContextMenu
		});

		// Now create the 2 editor configuration objects,
		// ensure that the xtypes are always configured to
		// the right type.
		return [
			Ext.apply({}, {
				xtype : config.htmlXtype || this.getHTMLEditorXtype(),
				name : config.htmlName || this.htmlName,
				enableKeyEvents : config.enableKeyEvents || false
			}, componentConfig),

			Ext.apply({}, {
				xtype : config.plaintextXtype || this.plaintextXtype,
				name : config.plaintextName || this.plaintextName,
				enableKeyEvents : config.enableKeyEvents || false
			}, componentConfig)
		];
	},

	/**
	 * Event handler which is raised just before the {@link Ext.Container container}
	 * is being rendered. At this moment the Editor component is being initialized,
	 * and if avaiable the configured events will be relayed from the Editor to
	 * this {@link Ext.Container container}.
	 * @param {Ext.Container} container The container being rendered
	 * @private
	 */
	onBeforeRender : function(container)
	{
		if (!Ext.isEmpty(this.relayedEvents)) {
			this.items.each(function(item) {
				this.relayEvents(item, this.relayedEvents);
			}, this);
		}
	},

	/**
	 * Sets the underlying DOM field's value directly, bypassing validation.
	 * To set the value with validation see {@link #setValue}.
	 * @param {Mixed} value The value to set
	 * @return {Ext.form.Field} this
	 */
	setRawValue : function(value)
	{
		var component = this.getLayout().activeItem;
		return component.setRawValue(value);
	},

	/**
	 * Sets a data value into the field and validates it.
	 * To set the value directly without validation see {@link #setRawValue}
	 * @param {Mixed} value The value to set
	 * @return {Ext.form.Field} this
	 */
	setValue : function(value)
	{
		var component = this.getLayout().activeItem;
		return component.setValue(value);
	},

	/**
	 * Returns the raw data value which may or may not be a valid, defined value.
	 * To return a normalized value see {@link #getValue}.
	 * @return {Mixed} value The field value
	 */
	getRawValue : function()
	{
		var component = this.getLayout().activeItem;
		return component.getRawValue();
	},

	/**
	 * Returns the normalized data value (undefined or emptyText will be returned as '').
	 * To return the raw value see {@link #getRawValue}.
	 * @return {Mixed} value The field value
	 */
	getValue : function()
	{
		var component = this.getLayout().activeItem;
		return component.getValue();
	},

	/**
	 * Try to focus this component.
	 * @param {Boolean} selectText (optional) If applicable, true to also select the text in this component
	 * @param {Boolean/Number} delay (optional) Delay the focus this number of milliseconds (true for 10 milliseconds)
	 * @return {Ext.Component} this
	 */
	focus : function(select, delay)
	{
		var component = this.getLayout().activeItem;
		component.focus(select, delay);
	},

	/**
	 * Resets the current field value to the originally loaded value and clears any validation messages.
	 * See {@link Ext.form.BasicForm}.{@link Ext.form.BasicForm#trackResetOnLoad trackResetOnLoad}
	 */
	reset : function()
	{
		var component = this.getLayout().activeItem;
		component.reset();
	},

	/**
	 * Enables all components using this action.
	 */
	enable : function()
	{
		this.items.each(function(item) {
			item.enable();
		});
	},

	/**
	 * Disables all components using this action.
	 */
	disable : function()
	{
		this.items.each(function(item) {
			item.disable();
		});
	},

	/**
	 * Obtain the currently active Editor Component.
	 * @return {Ext.form.Field} The currently active Component in the editor
	 */
	getEditor : function()
	{
		return this.getLayout().activeItem;
	},

	/**
	 * Returns the {@link #name} or {@link #hiddenName} attribute of the field if available.
	 * @return {String} name The field {@link Ext.form.Field#name name} or {@link Ext.form.ComboBox#hiddenName hiddenName}
	 */
	getName : function()
	{
		var component = this.getLayout().activeItem;
		return component.getName();
	},

	/**
	 * Updates the {@link #useHtml} flag and {@link Ext.layout.CardLayout#setActiveItem activates}
	 * the corresponding {@link Ext.form.Field editor} from {@link #items}.
	 * @param {Boolean} useHtml True to enable the HTML editor
	 * @param {Boolean} convert (optional) False to prevent the current {@link #getValue value}
	 * to be converted to the new editor.
	 */
	setHtmlEditor : function(useHtml, convert)
	{
		if (this.useHtml !== useHtml) {
			var layout = this.getLayout();
			var value = layout.activeItem.getValue();
			
			this.useHtml = useHtml;
			layout.setActiveItem(useHtml ? 0 : 1);

			// Convert the old value
			if (convert !== false && !Ext.isEmpty(value)) {
				var newValue;
				if (useHtml) {
					newValue = Zarafa.core.HTMLParser.convertPlainToHTML(value);
				} else {
					newValue = Zarafa.core.HTMLParser.convertHTMLToPlain(value);
				}

				this.fireEvent('change', this, newValue, value);
				layout.activeItem.setValue(newValue);
			}
		}
	},

	/**
	 * Indicates if the Editor is currently working in HTML mode or not.
	 * @return {Boolean} True if the editor is currently in HTML mode.
	 */
	isHtmlEditor : function()
	{
		return this.useHtml;
	},

	/**
	 * Function is used to set the cursor position in {@link Zarafa.common.form.TextArea}.
	 */
	onSetAutoFocusCursor: function()
	{
		var component = this.getLayout().activeItem;
		component.setCursorLocation();
	},

	/**
	 * Function inserts HTML text into the editor field where cursor is positioned.
	 * @param {String} value The text which must be inserted at the cursor position
	 */
	insertAtCursor : function(value)
	{
		var component = this.getLayout().activeItem;
		component.insertAtCursor(value);
	},

	/**
	 * bind a record to this component
	 * overriden because a record is needed for the HTML editor when there are inline images
	 * @param {Zarafa.core.data.IPMRecord} record
	 */
	bindRecord : function(record)
	{
		if(this.isHtmlEditor()) {
			var component = this.getLayout().activeItem;
			component.bindRecord(record);
		}
	},

	/**
	 * Function used to get the configured editor xtype.
	 * @return {String} configured editor xtype.
	 */
	getHTMLEditorXtype : function()
	{
		var editorPlugins = container.getPlugins().filter(function (htmlEditorPlugin){
			return htmlEditorPlugin instanceof Zarafa.core.HtmlEditorPlugin;
		});
		var configuredEditor = container.getSettingsModel().get('zarafa/v1/contexts/mail/html_editor');
		var editorPlugin = editorPlugins.find(function(editorPlugin){
			return editorPlugin.getName() === configuredEditor;
		});

		if (editorPlugin) {
			// Don't fail if a plugin didn't define an editorXType
			this.htmlXtype = editorPlugin.editorXType || this.htmlXtype;
		}
		return this.htmlXtype;
	}
});

Ext.reg('zarafa.editorfield', Zarafa.common.ui.EditorField);
