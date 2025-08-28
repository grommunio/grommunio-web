Ext.namespace('Zarafa.common.ui');

/**
 * @class Zarafa.common.ui.EditorField
 * @extends Ext.Container
 * @xtype zarafa.editorfield
 *
 * The grommunio Web EditorField is intended as Input area for data. This field
 * offers the possibility for editing using the {@link Zarafa.common.ui.HtmlEditor HtmlEditor}
 * or a simple {@link Ext.form.TextArea textarea}.
 */
Zarafa.common.ui.EditorField = Ext.extend(Ext.Container, {
	/**
	 * @cfg {Boolean} useHtml Use the {@link Zarafa.common.ui.HtmlEditor HTML editor}
	 * by default. Otherwise the {@link Ext.form.TextArea PlainTextEditor}.
	 */
	useHtml: true,
	/**
	 * @cfg {String} htmlXtype The Xtype of the component which is used for the Html editor
	 * By default this is {@link Zarafa.common.ui.HtmlEditor zarafa.htmleditor}.
	 */
	htmlXtype: 'zarafa.htmleditor',
	/**
	 * @cfg {String} plaintextXtype The Xtype of the component which is used for the Plain
	 * text editor. By default this is {@link Zarafa.common.form.TextArea textarea}.
	 */
	plaintextXtype: 'zarafa.textarea',
	/**
	 * @cfg {String} htmlName The {@link Ext.form.Field#name name} property of the
	 * {@link Zarafa.common.ui.HtmlEditor zarafa.htmleditor}
	 */
	htmlName: '',
	/**
	 * @cfg {String} plaintextName The {@link Ext.form.Field#name name} property of the
	 * {@link Zarafa.common.form.TextArea textarea}
	 */
	plaintextName: '',
	/**
	 * @cfg {Boolean} readOnly Start the editor in read only mode. When enabled the
	 * editor will switch to edit mode on double click.
	 */
	readOnly: false,
	/**
	 * @cfg {Object} componentConfig (optional) The configuration object which must be
	 * used for the Editor component. This can be the configuration object for the
	 * {@link Zarafa.common.ui.HtmlEditor HtmlEditor} and {@link Zarafa.common.ui.TextArea textarea}.
	 * If this object is not set, the configuration object used to create this
	 * {@link Zarafa.common.ui.EditorField component} will be used.
	 */
	componentConfig: undefined,
	/**
	 * @cfg {Array} relayedEvents (optional) the array of event names which must
	 * be relayed from the Editor component to this {@link Zarafa.common.ui.EditorField field}.
	 * This allows the user to listen to events directly coming from the Editor.
	 */
	relayedEvents: ['change', 'valuecorrection','keypress', 'initialized'],
	/**
	 * @cfg {Boolean} allowEdit Allow switching from read only to edit mode by
	 * double clicking the editor. When disabled the editor will remain
	 * read only.
	 */
	allowEdit: true,
	/**
	 * @cfg {Boolean} enableSystemContextMenu Enable the browser's default contextmenu
	 * to be opened on the {@link #items element}.
	 */
	enableSystemContextMenu: true,
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor: function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype: 'zarafa.editorfield',
			layout: 'card',
			items: this.getEditors(config)
		});

		Ext.apply(this, config);

		// Determine the default item
		config.activeItem = this.useHtml ? 0: 1;

		// Register all relayed events as possible events from this component
		this.addEvents.apply(this, this.relayedEvents);

		this.addEvents(
			/**
			 * @event setAutoFocusCursor
			 * Fires when text area gets the focus.
			 */
			'setAutoFocusCursor'
		);

		Zarafa.common.ui.EditorField.superclass.constructor.call(this, config);

		this.on('beforerender', this.onBeforeRender, this);
		this.on('setAutoFocusCursor', this.onSetAutoFocusCursor, this);
		this.on('initialized', this.onEditorInitialized, this);
		this.on('show', this.onShow, this);
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
	getEditors: function(config)
	{
		var componentConfig = config.componentConfig;

		// If componentConfig is not given, we use the config object itself,
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
			// By default the HtmlEditor has hideMode: 'offsets',
			// which doesn't work with with the CardLayout as that
			// hides the Form element, but preserves the height
			// causing the other components to displayed at a weird
			// offset.
			hideMode: 'display',
			// Update reference
			ownerCt: this,
			// Toggle the system contextmenu
			enableSystemContextMenu: this.enableSystemContextMenu
		});

		// Now create the 2 editor configuration objects,
		// ensure that the xtypes are always configured to
		// the right type.
		return [
			Ext.apply({}, {
				xtype: config.htmlXtype || this.getHTMLEditorXtype(),
				name: config.htmlName || this.htmlName,
				enableKeyEvents: config.enableKeyEvents || false
			}, componentConfig),

			Ext.apply({}, {
				xtype: config.plaintextXtype || this.plaintextXtype,
				name: config.plaintextName || this.plaintextName,
				enableKeyEvents: config.enableKeyEvents || false
			}, componentConfig)
		];
	},

	/**
	 * Event handler which is raised just before the {@link Ext.Container container}
	 * is being rendered. At this moment the Editor component is being initialized,
	 * and if available the configured events will be relayed from the Editor to
	 * this {@link Ext.Container container}.
	 * @param {Ext.Container} container The container being rendered
	 * @private
	 */
	onBeforeRender: function(container)
	{
		if (!Ext.isEmpty(this.relayedEvents)) {
			this.items.each(function(item) {
				this.relayEvents(item, this.relayedEvents);
			}, this);
		}
	},

	/**
	 * Called when the underlying editor finished initializing. This will set the
	 * configured readOnly state and register a double click handler to switch
	 * to edit mode.
	 */
	onEditorInitialized: function()
	{
		this.setReadOnly(this.readOnly);

		if (this.readOnly && this.allowEdit) {
			var editor = this.getEditor();
			this.dblClickListener = function() {
				this.setReadOnly(false);
			};
			editor.on('dblclick', this.dblClickListener, this);
		}
	},

	/**
	 * Toggle read-only state on the current editor.
	 * @param {Boolean} readOnly True to make the editor read-only
	 */
	setReadOnly: function(readOnly)
	{
		this.readOnly = readOnly;
		var editor = this.getEditor();
		editor.readOnly = readOnly;
		if (Ext.isFunction(editor.setReadOnly)) {
			editor.setReadOnly(readOnly);
		} else if (readOnly && Ext.isFunction(editor.disable)) {
			editor.disable();
		} else if (!readOnly && Ext.isFunction(editor.enable)) {
			editor.enable();
		}

		if (!readOnly && Ext.isFunction(editor.focus)) {
			editor.focus(false, 50);
		}

		if (editor) {
			if (!readOnly && this.dblClickListener) {
				editor.un('dblclick', this.dblClickListener, this);
				this.dblClickListener = null;
			} else if (readOnly && this.allowEdit && !this.dblClickListener) {
				this.dblClickListener = function() {
					this.setReadOnly(false);
				};
				editor.on('dblclick', this.dblClickListener, this);
			}
		}
	},

	/**
	 * Enable or disable switching to edit mode by double click.
	 * @param {Boolean} allow True to allow editing
	 */
	setAllowEdit: function(allow)
	{
		this.allowEdit = allow;
		var editor = this.getEditor();
		if (editor) {
			if (this.dblClickListener) {
				editor.un('dblclick', this.dblClickListener, this);
				this.dblClickListener = null;
			}
			if (allow && this.readOnly) {
				this.dblClickListener = function() {
					this.setReadOnly(false);
				};
				editor.on('dblclick', this.dblClickListener, this);
			}
		}
	},

	/**
	 * Ensure the HTML editor is active when showing this field so HTML is rendered
	 * instead of displayed as plain text after switching tabs.
	 */
	onShow: function()
	{
		var layout = this.getLayout();

		// Ensure the HTML editor component is active so HTML is rendered
		if (this.useHtml && layout.activeItem !== this.items.get(0)) {
			var value = this.getValue();
			this.setHtmlEditor(true, false);
			this.setValue(value);
		}

		// When returning to this field, TinyMCE might have been hidden; reload it
		var editor = this.getEditor();
		if (editor && Ext.isFunction(editor.withEd)) {
			editor.withEd(function() {
				var ed = editor.getEditor();
				if (ed && ed.isHidden()) {
					ed.load();
				}
			});
		}
	},

	/**
	 * Sets the underlying DOM field's value directly, bypassing validation.
	 * To set the value with validation see {@link #setValue}.
	 * @param {Mixed} value The value to set
	 * @return {Ext.form.Field} this
	 */
	setRawValue: function(value)
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
	setValue: function(value)
	{
		var component = this.getLayout().activeItem;
		return component.setValue(value);
	},

	/**
	 * Returns the raw data value which may or may not be a valid, defined value.
	 * To return a normalized value see {@link #getValue}.
	 * @return {Mixed} value The field value
	 */
	getRawValue: function()
	{
		var component = this.getLayout().activeItem;
		return component.getRawValue();
	},

	/**
	 * Returns the normalized data value (undefined or emptyText will be returned as '').
	 * To return the raw value see {@link #getRawValue}.
	 * @return {Mixed} value The field value
	 */
	getValue: function()
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
	focus: function(select, delay)
	{
		var component = this.getLayout().activeItem;
		component.focus(select, delay);
	},

	/**
	 * Resets the current field value to the originally loaded value and clears any validation messages.
	 * See {@link Ext.form.BasicForm}.{@link Ext.form.BasicForm#trackResetOnLoad trackResetOnLoad}
	 */
	reset: function()
	{
		var component = this.getLayout().activeItem;
		component.reset();
	},

	/**
	 * Enables all components using this action.
	 */
	enable: function()
	{
		this.items.each(function(item) {
			item.enable();
		});
	},

	/**
	 * Disables all components using this action.
	 */
	disable: function()
	{
		this.items.each(function(item) {
			item.disable();
		});
	},

	/**
	 * Obtain the currently active Editor Component.
	 * @return {Ext.form.Field} The currently active Component in the editor
	 */
	getEditor: function()
	{
		return this.getLayout().activeItem;
	},

	/**
	 * Returns the {@link #name} or {@link #hiddenName} attribute of the field if available.
	 * @return {String} name The field {@link Ext.form.Field#name name} or {@link Ext.form.ComboBox#hiddenName hiddenName}
	 */
	getName: function()
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
	setHtmlEditor: function(useHtml, convert)
	{
		if (this.useHtml !== useHtml) {
			var layout = this.getLayout();
			var value = layout.activeItem.getValue();

			this.useHtml = useHtml;
			layout.setActiveItem(useHtml ? 0: 1);

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
	isHtmlEditor: function()
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
	 * Function is used to get current editor content.
	 */
	getContent: function()
	{
		return this.tinyMceTextArea.getEditorContent();
	},

	/**
	 * Check if the editor content already contains the signature.
	 */
	hasSignature: function()
	{
		var component = this.getLayout().activeItem;

		// Check if the active editor is TinyMCE
		if (component instanceof Ext.ux.form.TinyMCETextArea) {
			return component.hasSignature();
		} else {
			// For plain text editor, convert the HTML signature to plain text
			var content = component.getValue();
			var plainSignature = Zarafa.core.HTMLParser.convertHTMLToPlain(this.currentSignatureHtml);

			return content.includes(plainSignature);
		}
	},

	/**
	 * Replace the content of the existing signature.
	 * @param {String} value The text which is to be replaced for in-place-signature edit
	 */
	replaceSignatureContent: function(newContent) {
		var component = this.getLayout().activeItem;

		// Check if the active editor is TinyMCE
		if (component instanceof Ext.ux.form.TinyMCETextArea) {
			component.replaceSignatureContent(newContent);
		} else {
			// For plain text editor, convert the HTML signature to plain text
			var content = component.getValue();
			var plainSignature = Zarafa.core.HTMLParser.convertHTMLToPlain(this.currentSignatureHtml);

			// Replace the plain text signature
			if (content.includes(plainSignature)) {
			var beforeSignature = content.split(plainSignature)[0];
			component.setValue(beforeSignature + Zarafa.core.HTMLParser.convertHTMLToPlain(newContent)); // Replace with converted plain text
			}
		}
	},

	/**
	 * Skip moveToSignature for plain text editor
	 */
	moveToSignature: function() {
		var component = this.getLayout().activeItem;

		// Check if the active editor is TinyMCE
		if (component instanceof Ext.ux.form.TinyMCETextArea) {
			component.moveToSignature();
		}
	},

	/**
	 * Function inserts HTML text into the editor field where cursor is positioned.
	 * @param {String} value The text which must be inserted at the cursor position
	 */
	insertAtCursor: function(value)
	{
		var component = this.getLayout().activeItem;
		component.insertAtCursor(value);
	},

	/**
	 * Function select the text in editor by given selector.
	 *
	 * @param {String} selector The selector query which used to select the text in editor.
	 * @return {boolean} return true if text is selected in editor else false.
	 */
	selectBySelector: function(selector)
	{
		var component = this.getLayout().activeItem;
		return component.selectBySelector(selector);
	},

	/**
	 * bind a record to this component
	 * overridden because a record is needed for the HTML editor when there are inline images
	 * @param {Zarafa.core.data.IPMRecord} record
	 */
	bindRecord: function(record)
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
	getHTMLEditorXtype: function()
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
