/*--------------------------------------------------------------------
 Ext.ux.form.TinyMCETextArea

 ExtJS form field - a text area with integrated TinyMCE WYSIWYG Editor

 Integration for TinyMCE 7.x WYSIWYG Editor with HTML5 text areas and
 ExtJS integration

 Rewrite by grommunio, inspired by the work of:

 - Oleg Schildt
 - Steve Drucker
 - Bhavin Bathani
--------------------------------------------------------------------*/

Ext.ux.form.TinyMCETextArea = Ext.extend(Ext.form.TextArea, {
	/**
	 * Flag for tracking the initialization state.
	 * @property
	 * @type Boolean
	 */
	wysiwygIntialized: false,

	/**
	 * Indicates if the initialization of this editor is in progress.
	 * @property
	 * @type Boolean
	 */
	intializationInProgress: false,

	/**
	 * The height of the editor applied previously.
	 * @property
	 * @type Number
	 */
	lastHeight: null,

	/**
	 * The height of the editor iframe applied previously.
	 * @property
	 * @type Number
	 */
	lastFrameHeight: null,

	/**
	 * This properties enables starting without WYSIWYG editor.
	 * The user can activate it later if he wants.
	 * @property
	 * @type Boolean
	 */
	noWysiwyg: false,

	/**
	 * @cfg {Object} tinyMCEConfig Configuration object for the TinyMCE configuration options
	 */
	tinyMCEConfig: {},

	/**
	 * This property holds the editor instance.
	 * @property
	 * @type Object
	 */
	editor: undefined,

	/**
	 * @cfg {Boolean} disabled Render this component disabled (default is false).
	 */
	disableEditor: false,

	/**
	 * This property holds the window object which is the owner of the selector element.
	 * @property
	 * @type HTMLElement
	 */
	editorOwnerWindow: undefined,

	/**
	 * @constructor
	 * @param {Object} config The configuration options.
	 */
	constructor: function(config)
	{
		config = config || {};
		Ext.applyIf(config, {
			hideMode: "offsets"
		});
		Ext.applyIf(config.tinyMCEConfig, {
			hideMode: "offsets",
			resize: false,
			license_key: "gpl"
		});
		Ext.ux.form.TinyMCETextArea.superclass.constructor.call(this, config);
	},

	/**
	 * Helper function provides the owner window object.
	 * @return {HTMLElement} the window object which contains the selector element.
	 * @private
	 */
	getEditorOwnerWindow: function()
	{
		if (Ext.isDefined(this.editorOwnerWindow)) {
			return this.editorOwnerWindow;
		} else {
			var selectorElement = Ext.getDom(this.getInputId());
			var browserWindow = selectorElement ? selectorElement.ownerDocument.defaultView : undefined;
			return this.editorOwnerWindow = browserWindow;
		}
	},

	/**
	 * Function called after the editor has been rendered
	 * @private
	 */
	afterRender: function()
	{
		var me = this;
		Ext.ux.form.TinyMCETextArea.superclass.afterRender.call(this, arguments);
		this.initEditor();
		me.on("blur", (function(elm, ev, eOpts) {
			var ctrl = document.getElementById(me.getInputId());
			if (me.wysiwygIntialized) {
				var ed = me.getEditor();
				if (ed && ed.isHidden()) {
					if (ctrl) {
						me.positionBeforeBlur = {
							start: ctrl.selectionStart,
							end: ctrl.selectionEnd
						};
					}
					ed.load();
				}
			} else {
				if (ctrl) {
					me.positionBeforeBlur = {
						start: ctrl.selectionStart,
						end: ctrl.selectionEnd
					};
				}
			}
		}), me);
		me.on("resize", (function(elm, width, height, oldWidth, oldHeight, eOpts) {
			me.syncEditorHeight(height);
		}), me);
	},

	/**
	 * Sets the height of the editor iframe.
	 * The toolbar/menubar/statusbar height needs to be subtracted from
	 * total height to find out the iframe height.
	 * @param {Mixed} height The new height to set.
	 * @private
	 */
	syncEditorHeight: function(height)
	{
		var me = this;
		me.lastHeight = height;
		if (!me.wysiwygIntialized || !me.rendered) {
			return;
		}
		var browserWindow = me.getEditorOwnerWindow();
		var ed = browserWindow.tinymce.get(me.getInputId());
		if (!ed || !ed.iframeElement) {
			return;
		}
		if (ed.isHidden()) {
			return;
		}
		var edIframe = Ext.get(ed.iframeElement);
		var parent = edIframe.up(".mce-edit-area");
		if (!parent) {
			return;
		}
		parent = parent.up(".mce-container-body");
		if (!parent) {
			return;
		}
		var newHeight = height;
		var edToolbar = parent.down(".mce-toolbar-grp");
		if (edToolbar) newHeight -= edToolbar.getHeight();
		var edMenubar = parent.down(".mce-menubar");
		if (edMenubar) newHeight -= edMenubar.getHeight();
		var edStatusbar = parent.down(".mce-statusbar");
		if (edStatusbar) newHeight -= edStatusbar.getHeight();
		me.lastFrameHeight = newHeight - 100;
		edIframe.setHeight(newHeight - 100);
	},

	/**
	 * If ed (local editor instance) is already initialized, calls specified function directly.
	 * Otherwise reschedule that particular function call on {@link tinymce.Editor.init init} event.
	 * @param {Function} func The function definition which is to be called while editor is completely ready.
	 * @private
	 */
	withEd: function(func)
	{
		var me = this;
		var ed = this.getEditor();
		if (ed) {
			if (!ed.initialized) {
				this.on("initialized", (function() {
					me.withEd(func);
				}), me);
			} else if (ed.initialized) {
				me.editor = ed;
				func.call(me);
			}
		}
	},

	/**
	 * @return {String} Returns the input id for this field. If none was specified via the {@link #inputId} config,
	 * then an id will be automatically generated.
	 */
	getInputId: function()
	{
		return this.inputId || (this.inputId = this.id);
	},

	/**
	 * Method to determine whether this Component is currently disabled.
	 * @return {Boolean} the disabled state of this Component.
	 */
	isDisabled: function()
	{
		return this.disabled;
	},

	/**
	 * Inserts the passed text at the current cursor position. The editor must be initialized
	 * to insert text.
	 * @param {String} value Text which needs to be inserted
	 */
	insertAtCursor: function(value)
	{
		var ed = this.getEditor();
		if (ed) {
			var doc = ed.getDoc();
			var body = doc.body;
			// Create a range and insert the HTML directly at the cursor
			var range = ed.selection.getRng();
			var fragment = range.createContextualFragment(value);
			// Insert the fragment at the current range
			range.insertNode(fragment);
			ed.undoManager.clear();
		} else {
			console.error("Editor instance not available for direct DOM insertion.");
		}
	},

	/**
	 * Check if the signature already exists in the editor content.
	 * @return {Boolean} the state if a signature exists.
	 */
	hasSignature: function()
	{
		var ed = this.getEditor();
		if (ed) {
			var content = ed.getContent();
			return content.indexOf('class="signatureContainer"') !== -1;
		}
		return false;
	},

	/**
	 * Move the cursor to the existing signature in the editor.
	 */
	moveToSignature: function()
	{
		var ed = this.getEditor();
		if (ed) {
			var selection = ed.dom.select(".signatureContainer");
			if (selection.length > 0) {
				ed.selection.select(selection[0]);
				ed.selection.collapse(false);
			}
		}
	},

	/**
	 * Replace the content of the existing signature.
	 * @param {String} value Content which needs to be inserted.
	 */
	replaceSignatureContent: function(newContent)
	{
		var ed = this.getEditor();
		if (ed) {
			var selection = ed.dom.select(".signatureContainer");
			if (selection.length > 0) {
				ed.dom.setHTML(selection[0], newContent);
				ed.selection.select(selection[0]);
				ed.selection.collapse(false);
			}
		}
	},
	/**
	 * Select editor content based on selector.
	 * @param {String} value Name of editor object to be selected.
	 * @return {Boolean} success of select node action.
	 */
	selectBySelector: function(selector)
	{
		var ed = this.getEditor();
		var selection = ed.getDoc().querySelector(selector);
		if (selection) {
			ed.execCommand("mceSelectNode", false, selection);
			return true;
		}
		return false;
	},

	/**
	 * Initialized the editor.
	 * Assign necessary {@link #tinyMCEConfig} options and register necessary events to handle content
	 * and height of editor.
	 * Will call {@link tinymce.Editor.init init} method to setup iframe and create theme and plugin instances.
	 * @private
	 */
	initEditor: function()
	{
		var me = this;
		if (me.noWysiwyg || me.intializationInProgress || me.wysiwygIntialized) {
			return;
		}
		me.intializationInProgress = true;
		me.tinyMCEConfig.selector = "textarea#" + me.getInputId();
		if (me.lastFrameHeight) {
			me.tinyMCEConfig.height = me.lastFrameHeight;
		} else {
			me.tinyMCEConfig.height = 30;
		}
		var user_setup = null;
		if (me.tinyMCEConfig.setup) {
			user_setup = me.tinyMCEConfig.setup;
		}
		me.tinyMCEConfig.setup = function(ed) {
			if (!Ext.isDefined(me.editor)) {
				me.editor = ed;
			}
			ed.on("init", (function(e) {
				me.wysiwygIntialized = true;
				me.intializationInProgress = false;
				if (me.disableEditor || me.isDisabled()) {
					me.disable();
				}
				me.fireEvent("initialized", me, ed, {});
				function setEditorHeight() {
					me.syncEditorHeight(me.lastHeight || me.height);
				}
				if (me.lastHeight || me.height) {
					setEditorHeight();
				}
			}));
			if (user_setup) {
				user_setup(ed);
			}
		};
		me.getEditorOwnerWindow().tinymce.init(me.tinyMCEConfig);
		me.intializationInProgress = false;
		me.wysiwygIntialized = true;
	},

	/**
	 * Retrieves the editor instance if the value of {@link #editor} property is empty.
	 * @return {Object} the editor instance.
	 */
	getEditor: function()
	{
		var editorWindow = this.getEditorOwnerWindow();
		return editorWindow ? editorWindow.tinymce.get(this.getInputId()) : undefined;
	},

	/**
	 * Destroys the editor instance by removing all events, element references.
	 * @return {Object} me the current scope or container instance.
	 */
	removeEditor: function()
	{
		var me = this;
		if (me.intializationInProgress) {
			return me;
		}
		if (!me.wysiwygIntialized) {
			return me;
		}
		var ed = me.getEditor();
		if (ed) {
			ed.save();
			ed.destroy(false);
		}
		me.wysiwygIntialized = false;
		return me;
	},

	/**
	 * Sets a data value into the field and runs the validation.
	 * @param {String} v The value to set
	 * @return {String} Value which was set
	 */
	setValue: function(v)
	{
		var me = this;
		if (me.wysiwygIntialized) {
			if (this.value !== v) {
				this.value = v;
				if (this.rendered) {
					var ed = me.getEditor();
					if (!ed) {
						var editorGlobalInstance = me.getEditorOwnerWindow().tinymce;
						editorGlobalInstance.EditorManager.on("AddEditor", (function() {
							me.withEd((function() {
								var ed = me.getEditor();
								if (!ed.isDirty()) {
									me.setContent(ed, v);
								}
							}));
						}), this);
					} else {
						me.setContent(ed, v);
					}
				}
			}
		}
		return this.value;
	},

	/**
	 * Function is used to set the content in HTML Editor.
	 * @param {Object} editor the HTML Editor Object
	 * @param {String} value the value which is going to set in editor.
	 */
	setContent: function(editor, value)
	{
		editor.setContent(value === null || value === undefined ? "" : value, {
			format: "raw"
		});
		editor.startContent = editor.getContent({
			format: "raw"
		});
	},

	/**
	 * Returns the current data value of the editor.
	 * @return {String} v The field value
	 */
	getValue: function(some)
	{
		var ed = this.getEditor();
		if (!ed) {
			return;
		}
		if (!this.rendered || !ed.initialized) return Ext.value(this.value, "");
		var v = ed.getContent();
		if (v === this.emptyText || v === undefined) {
			v = "";
		}
		return v;
	},

	/**
	 * Returns the raw data value which may or may not be a valid, defined value.
	 * @return {Mixed} v The field value
	 */
	getRawValue: function()
	{
		var ed = this.getEditor();
		if (!ed) {
			return;
		}
		if (!this.rendered || !ed.initialized) return Ext.value(this.value, "");
		var v = ed.getContent({
			format: "raw"
		});
		if (v === this.emptyText) {
			v = "";
		}
		return v;
	},

	/**
	 * Initializes the field's value based on the initial config.
	 * @return {Mixed} v The field value
	 */
	initValue: function()
	{
		if (!this.rendered) Ext.ux.TinyMCE.superclass.initValue.call(this); else {
			if (this.value !== undefined) {
				this.setValue(this.value);
			} else {
				var v = this.getEl().value;
				if (v) this.setValue(v);
			}
		}
	},

	/**
	 * Focuses/activates the editor. This will set this editor as the activeEditor in the tinymce collection.
	 * If the editor is not initialized yet than Try to focus this component.
	 * @param {Boolean} selectText (optional) If applicable, true to also select the text in this component.
	 * @param {Boolean/Number} delay (optional) Delay the focus this number of milliseconds (true for 10 milliseconds)
	 * @return {Ext.Component} me
	 */
	focus: function(selectText, delay)
	{
		var me = this;
		if (me.isDisabled()) {
			return me;
		}
		if (delay) {
			if (isNaN(delay)) {
				delay = 10;
			}
			setTimeout((function() {
				me.focus.call(me, selectText, false);
			}), delay);
			return me;
		}
		if (!me.wysiwygIntialized) {
			return Ext.ux.form.TinyMCETextArea.superclass.focus.call(this, arguments);
		}
		var ed = me.getEditor();
		if (ed && !ed.isHidden() && ed.initialized) {
			Ext.ux.form.TinyMCETextArea.superclass.focus.call(this, arguments);
			ed.focus();
		} else {
			this.withEd((function() {
				ed.focus();
			}));
			return Ext.ux.form.TinyMCETextArea.superclass.focus.call(this, arguments);
		}
		return me;
	},

	/**
	 * Enable this component.
	 * @return {Ext.Component} this
	 */
	enable: function()
	{
		var me = this;
		var result = Ext.ux.form.TinyMCETextArea.superclass.enable.call(this, arguments);
		if (!result) {
			return result;
		}
		var ed = me.getEditor();
		if (ed) {
			ed.mode.set("design");
		}
		return me;
	},

	/**
	 * Disable this component.
	 * @param {Boolean} silent true to prevent fire 'disable' event
	 * @return {Ext.Component} this
	 */
	disable: function(silent)
	{
		var me = this;
		var result = Ext.ux.form.TinyMCETextArea.superclass.disable.call(this, arguments);
		if (!result) {
			return result;
		}
		me.withEd((function() {
			var ed = me.getEditor();
			ed.mode.set("readonly");
		}));
		return me;
	},

	/**
	 * Hide this component.
	 * @return {Ext.Component} this
	 */
	hide: function()
	{
		var me = this;
		Ext.ux.form.TinyMCETextArea.superclass.hide.call(this, arguments);
		var ed = me.getEditor();
		if (ed && ed.iframeElement) {
			ed.hide();
		} else {
			me.withEd((function() {
				var ed = me.getEditor();
				ed.hide();
			}));
		}
		return me;
	},

	/**
	 * Show this component.
	 * @return {Ext.Component} this
	 */
	show: function()
	{
		var me = this;
		Ext.ux.form.TinyMCETextArea.superclass.show.call(this, arguments);
		var ed = me.getEditor();
		if (ed) {
			ed.show();
		}
		return me;
	}
});

Ext.reg("zarafa.tinymcetextarea", Ext.ux.form.TinyMCETextArea);
